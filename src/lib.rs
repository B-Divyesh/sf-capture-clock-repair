//! Conservative capture-time analysis and reversible XMP sidecar writes.
//!
//! The scan operation is read-only:
//! ```no_run
//! use capture_clock_repair::{scan_archive, ScanOptions};
//! let plan = scan_archive("photos", ScanOptions::default())?;
//! println!("{} files need review", plan.summary.review);
//! # Ok::<(), capture_clock_repair::Error>(())
//! ```

use chrono::{DateTime, FixedOffset, LocalResult, NaiveDateTime, TimeZone, Utc};
use exif::{In, Reader, Tag, Value};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fmt::{self, Display};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

const REVIEW_HEADERS: [&str; 12] = [
    "id",
    "file",
    "source",
    "status",
    "original_time",
    "proposed_time",
    "offset",
    "inference",
    "confidence",
    "conflict",
    "action",
    "note",
];

#[derive(Debug)]
pub enum Error {
    Invalid(String),
    Io(std::io::Error),
    Csv(csv::Error),
    Json(serde_json::Error),
}

impl Error {
    pub fn exit_code(&self) -> i32 {
        match self {
            Self::Invalid(_) => 2,
            _ => 1,
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Invalid(message) => write!(f, "{message}"),
            Self::Io(error) => write!(f, "I/O error: {error}"),
            Self::Csv(error) => write!(f, "CSV error: {error}"),
            Self::Json(error) => write!(f, "JSON error: {error}"),
        }
    }
}

impl std::error::Error for Error {}
impl From<std::io::Error> for Error {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}
impl From<csv::Error> for Error {
    fn from(value: csv::Error) -> Self {
        Self::Csv(value)
    }
}
impl From<serde_json::Error> for Error {
    fn from(value: serde_json::Error) -> Self {
        Self::Json(value)
    }
}

#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub recursive: bool,
    pub timezone: String,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            recursive: true,
            timezone: "+00:00".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Summary {
    pub examined: usize,
    pub trusted: usize,
    pub proposed: usize,
    pub review: usize,
    pub unsupported: usize,
    pub sources: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewRecord {
    pub id: String,
    pub file: String,
    pub source: String,
    pub status: String,
    pub original_time: String,
    pub proposed_time: String,
    pub offset: String,
    pub inference: String,
    pub confidence: String,
    pub conflict: String,
    pub action: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub version: u8,
    pub root: String,
    pub timezone: String,
    pub records: Vec<ReviewRecord>,
    pub unsupported_files: Vec<String>,
    pub summary: Summary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestEntry {
    pub original: String,
    pub sidecar: String,
    pub sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoManifest {
    pub version: u8,
    pub created_at: String,
    pub review_file: String,
    pub created: Vec<ManifestEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyResult {
    pub created: usize,
    pub skipped: usize,
    pub dry_run: bool,
    pub sidecars: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoResult {
    pub removed: usize,
    pub skipped: usize,
    pub dry_run: bool,
}

#[derive(Default)]
struct ExifMetadata {
    taken: Option<String>,
    offset: Option<String>,
    make: Option<String>,
    model: Option<String>,
}

pub fn validate_offset(offset: &str) -> Result<(), Error> {
    if offset.len() != 6 || !matches!(&offset[0..1], "+" | "-") || &offset[3..4] != ":" {
        return Err(Error::Invalid(format!(
            "invalid timezone offset '{offset}'; expected +HH:MM or -HH:MM"
        )));
    }
    let hours: u8 = offset[1..3]
        .parse()
        .map_err(|_| Error::Invalid(format!("invalid timezone offset '{offset}'")))?;
    let minutes: u8 = offset[4..6]
        .parse()
        .map_err(|_| Error::Invalid(format!("invalid timezone offset '{offset}'")))?;
    if hours > 23 || minutes > 59 {
        return Err(Error::Invalid(format!(
            "invalid timezone offset '{offset}'"
        )));
    }
    Ok(())
}

/// Recursively inspect an archive without modifying it.
pub fn scan_archive(path: impl AsRef<Path>, options: ScanOptions) -> Result<Plan, Error> {
    validate_offset(&options.timezone)?;
    let root = fs::canonicalize(path.as_ref()).map_err(|error| {
        Error::Invalid(format!(
            "cannot open archive '{}': {error}",
            path.as_ref().display()
        ))
    })?;
    if !root.is_dir() {
        return Err(Error::Invalid(format!(
            "archive '{}' is not a directory",
            root.display()
        )));
    }
    let mut supported = Vec::new();
    let mut unsupported = Vec::new();
    collect_files(&root, options.recursive, &mut supported, &mut unsupported)?;
    supported.sort();
    unsupported.sort();
    let mut records = Vec::new();
    for (index, file) in supported.iter().enumerate() {
        records.push(inspect_file(file, index + 1, &options.timezone)?);
    }
    let mut source_names: Vec<&str> = records.iter().map(|r| r.source.as_str()).collect();
    source_names.sort_unstable();
    source_names.dedup();
    let summary = Summary {
        examined: records.len(),
        trusted: records
            .iter()
            .filter(|r| r.status.starts_with("trusted"))
            .count(),
        proposed: records.iter().filter(|r| r.status == "proposed").count(),
        review: records.iter().filter(|r| r.action == "review").count(),
        unsupported: unsupported.len(),
        sources: source_names.len(),
    };
    Ok(Plan {
        version: 1,
        root: root.to_string_lossy().into_owned(),
        timezone: options.timezone,
        records,
        unsupported_files: unsupported
            .iter()
            .map(|p| p.to_string_lossy().into_owned())
            .collect(),
        summary,
    })
}

pub fn write_plan(plan: &Plan, output: impl AsRef<Path>) -> Result<(), Error> {
    fs::create_dir_all(output.as_ref())?;
    let json_path = output.as_ref().join("plan.json");
    fs::write(json_path, serde_json::to_vec_pretty(plan)?)?;
    let csv_path = output.as_ref().join("review.csv");
    let mut writer = csv::WriterBuilder::new()
        .terminator(csv::Terminator::CRLF)
        .has_headers(false)
        .from_path(csv_path)?;
    writer.write_record(REVIEW_HEADERS)?;
    for record in &plan.records {
        writer.serialize(record)?;
    }
    writer.flush()?;
    Ok(())
}

/// Write approved XMP sidecars and a complete undo manifest.
pub fn apply_review(
    review_path: impl AsRef<Path>,
    manifest_path: impl AsRef<Path>,
    dry_run: bool,
) -> Result<ApplyResult, Error> {
    let review_path = fs::canonicalize(review_path.as_ref()).map_err(|error| {
        Error::Invalid(format!(
            "cannot read review CSV '{}': {error}",
            review_path.as_ref().display()
        ))
    })?;
    let mut reader = csv::Reader::from_path(&review_path)?;
    let actual = reader.headers()?.clone();
    if actual.iter().collect::<Vec<_>>() != REVIEW_HEADERS {
        return Err(Error::Invalid(
            "review CSV columns changed; restore the original header before applying".into(),
        ));
    }
    let mut operations = Vec::new();
    let mut skipped = 0;
    for item in reader.deserialize::<ReviewRecord>() {
        let record = item?;
        match record.action.trim().to_ascii_lowercase().as_str() {
            "accept" | "amend" => {
                if !record.original_time.trim().is_empty() || record.status.starts_with("trusted") {
                    return Err(Error::Invalid(format!(
                        "refusing row {}: files with an original DateTimeOriginal can only be kept",
                        record.id
                    )));
                }
                parse_iso_time(&record.proposed_time)
                    .map_err(|message| Error::Invalid(format!("row {}: {message}", record.id)))?;
                let original = PathBuf::from(&record.file);
                if !original.is_file() {
                    return Err(Error::Invalid(format!(
                        "row {}: original file '{}' is missing",
                        record.id,
                        original.display()
                    )));
                }
                let sidecar = sidecar_path(&original);
                if sidecar.exists() {
                    return Err(Error::Invalid(format!(
                        "row {}: sidecar '{}' already exists; it was not overwritten",
                        record.id,
                        sidecar.display()
                    )));
                }
                let body = xmp_document(&record);
                operations.push((original, sidecar, body));
            }
            "keep" | "review" | "skip" | "" => skipped += 1,
            action => {
                return Err(Error::Invalid(format!(
                    "row {}: unknown action '{action}'; use accept, amend, keep, review, or skip",
                    record.id
                )));
            }
        }
    }
    let sidecars = operations
        .iter()
        .map(|(_, sidecar, _)| sidecar.to_string_lossy().into_owned())
        .collect::<Vec<_>>();
    if dry_run {
        return Ok(ApplyResult {
            created: operations.len(),
            skipped,
            dry_run,
            sidecars,
        });
    }
    if operations.is_empty() {
        return Err(Error::Invalid(
            "nothing is approved; set action to accept or amend in the review CSV".into(),
        ));
    }
    let mut created: Vec<ManifestEntry> = Vec::new();
    for (original, sidecar, body) in operations {
        if let Err(error) = fs::write(&sidecar, body.as_bytes()) {
            for entry in &created {
                let _: Result<(), _> = fs::remove_file(&entry.sidecar);
            }
            return Err(Error::Io(error));
        }
        created.push(ManifestEntry {
            original: original.to_string_lossy().into_owned(),
            sidecar: sidecar.to_string_lossy().into_owned(),
            sha256: sha256(body.as_bytes()),
        });
    }
    let manifest = UndoManifest {
        version: 1,
        created_at: Utc::now().to_rfc3339(),
        review_file: review_path.to_string_lossy().into_owned(),
        created,
    };
    if let Some(parent) = manifest_path.as_ref().parent() {
        fs::create_dir_all(parent)?;
    }
    if let Err(error) = fs::write(
        manifest_path.as_ref(),
        serde_json::to_vec_pretty(&manifest)?,
    ) {
        for entry in &manifest.created {
            let _: Result<(), _> = fs::remove_file(&entry.sidecar);
        }
        return Err(Error::Io(error));
    }
    Ok(ApplyResult {
        created: manifest.created.len(),
        skipped,
        dry_run,
        sidecars,
    })
}

/// Remove sidecars listed by a manifest, but only when their checksums still match.
pub fn undo_manifest(path: impl AsRef<Path>, dry_run: bool) -> Result<UndoResult, Error> {
    let data = fs::read(path.as_ref()).map_err(|error| {
        Error::Invalid(format!(
            "cannot read undo manifest '{}': {error}",
            path.as_ref().display()
        ))
    })?;
    let manifest: UndoManifest = serde_json::from_slice(&data)?;
    if manifest.version != 1 {
        return Err(Error::Invalid(format!(
            "unsupported manifest version {}",
            manifest.version
        )));
    }
    let mut removable = Vec::new();
    let mut skipped = 0;
    for entry in manifest.created {
        let original = PathBuf::from(&entry.original);
        let sidecar = PathBuf::from(&entry.sidecar);
        if sidecar != sidecar_path(&original) {
            return Err(Error::Invalid(format!(
                "unsafe manifest entry for '{}'",
                sidecar.display()
            )));
        }
        if !sidecar.exists() {
            skipped += 1;
            continue;
        }
        let current = fs::read(&sidecar)?;
        if sha256(&current) != entry.sha256 {
            return Err(Error::Invalid(format!(
                "refusing to remove changed sidecar '{}'",
                sidecar.display()
            )));
        }
        removable.push(sidecar);
    }
    if !dry_run {
        for sidecar in &removable {
            fs::remove_file(sidecar)?;
        }
    }
    Ok(UndoResult {
        removed: removable.len(),
        skipped,
        dry_run,
    })
}

fn collect_files(
    dir: &Path,
    recursive: bool,
    supported: &mut Vec<PathBuf>,
    unsupported: &mut Vec<PathBuf>,
) -> Result<(), Error> {
    for item in fs::read_dir(dir)? {
        let path = item?.path();
        if path.is_dir() && recursive {
            collect_files(&path, true, supported, unsupported)?;
        } else if path.is_file() {
            let ext = path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            match ext.as_str() {
                "jpg" | "jpeg" => supported.push(path),
                "png" | "heic" | "heif" | "tif" | "tiff" | "dng" | "raw" | "cr2" | "cr3"
                | "nef" | "arw" | "mp4" | "mov" => unsupported.push(path),
                _ => {}
            }
        }
    }
    Ok(())
}

fn inspect_file(path: &Path, id: usize, fallback_offset: &str) -> Result<ReviewRecord, Error> {
    let exif = read_exif(path);
    let filename_time =
        timestamp_from_filename(path.file_stem().and_then(|s| s.to_str()).unwrap_or(""));
    let source = source_name(path, &exif);
    let mut record = ReviewRecord {
        id: format!("CCR-{id:05}"),
        file: path.to_string_lossy().into_owned(),
        source,
        status: String::new(),
        original_time: String::new(),
        proposed_time: String::new(),
        offset: String::new(),
        inference: String::new(),
        confidence: String::new(),
        conflict: String::new(),
        action: String::new(),
        note: String::new(),
    };
    if let Some(taken) = exif.taken {
        let offset = exif.offset.unwrap_or_default();
        record.original_time = format_exif_time(&taken, &offset).unwrap_or_else(|| taken.clone());
        record.offset = offset;
        record.status = "trusted".into();
        record.confidence = "embedded".into();
        record.action = "keep".into();
        record.note = "Embedded DateTimeOriginal kept; no patch will be written.".into();
        if let (Some(original), Some(named)) = (parse_exif_naive(&taken), filename_time) {
            let minutes = (original - named).num_minutes().unsigned_abs();
            if (55..=65).contains(&minutes) {
                record.status = "trusted_with_conflict".into();
                record.conflict = "possible_timezone_drift".into();
                record.note = format!(
                    "Filename clock differs by {minutes} minutes. Original remains protected; review the source timezone."
                );
            } else if minutes > 5 {
                record.status = "trusted_with_conflict".into();
                record.conflict = "filename_date_conflict".into();
                record.note = format!(
                    "Filename clock differs by {minutes} minutes. Original remains protected."
                );
            }
        }
        return Ok(record);
    }
    record.status = "proposed".into();
    record.offset = fallback_offset.into();
    if let Some(named) = filename_time {
        record.proposed_time = with_offset(named, fallback_offset)?;
        record.inference = "filename".into();
        record.confidence = "high".into();
        record.action = "accept".into();
        record.note = "Inferred from filename; verify the timezone offset before applying.".into();
    } else {
        let modified = fs::metadata(path)?
            .modified()
            .unwrap_or(SystemTime::UNIX_EPOCH);
        record.proposed_time =
            DateTime::<Utc>::from(modified).to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
        record.offset = "+00:00".into();
        record.inference = "filesystem_modified".into();
        record.confidence = "low".into();
        record.action = "review".into();
        record.note = "Weak fallback from filesystem modified time; amend or skip this row.".into();
    }
    Ok(record)
}

fn read_exif(path: &Path) -> ExifMetadata {
    let Ok(file) = File::open(path) else {
        return ExifMetadata::default();
    };
    let mut reader = BufReader::new(file);
    let Ok(exif) = Reader::new().read_from_container(&mut reader) else {
        return ExifMetadata::default();
    };
    ExifMetadata {
        taken: ascii_field(&exif, Tag::DateTimeOriginal),
        offset: ascii_field(&exif, Tag::OffsetTimeOriginal),
        make: ascii_field(&exif, Tag::Make),
        model: ascii_field(&exif, Tag::Model),
    }
}

fn ascii_field(exif: &exif::Exif, tag: Tag) -> Option<String> {
    let field = exif.get_field(tag, In::PRIMARY)?;
    if let Value::Ascii(values) = &field.value {
        let value = String::from_utf8_lossy(values.first()?)
            .trim_matches(char::from(0))
            .trim()
            .to_string();
        if !value.is_empty() {
            return Some(value);
        }
    }
    None
}

fn timestamp_from_filename(name: &str) -> Option<NaiveDateTime> {
    let digits: String = name
        .chars()
        .map(|c| if c.is_ascii_digit() { c } else { ' ' })
        .collect();
    let groups: Vec<&str> = digits.split_whitespace().collect();
    let mut candidates = Vec::new();
    for group in &groups {
        if group.len() >= 14 {
            candidates.push(group[0..14].to_string());
        }
    }
    for window in groups.windows(2) {
        if window[0].len() == 8 && window[1].len() >= 6 {
            candidates.push(format!("{}{}", window[0], &window[1][0..6]));
        }
    }
    if groups.len() >= 6 {
        for window in groups.windows(6) {
            if window[0].len() == 4
                && window[1].len() == 2
                && window[2].len() == 2
                && window[3].len() == 2
                && window[4].len() == 2
                && window[5].len() == 2
            {
                candidates.push(window.join(""));
            }
        }
    }
    candidates
        .into_iter()
        .find_map(|value| NaiveDateTime::parse_from_str(&value, "%Y%m%d%H%M%S").ok())
}

fn parse_exif_naive(value: &str) -> Option<NaiveDateTime> {
    NaiveDateTime::parse_from_str(value.trim(), "%Y:%m:%d %H:%M:%S").ok()
}

fn format_exif_time(value: &str, offset: &str) -> Option<String> {
    let naive = parse_exif_naive(value)?;
    if offset.is_empty() {
        Some(naive.format("%Y-%m-%dT%H:%M:%S").to_string())
    } else {
        with_offset(naive, offset).ok()
    }
}

fn with_offset(value: NaiveDateTime, offset: &str) -> Result<String, Error> {
    validate_offset(offset)?;
    let sign = if &offset[0..1] == "-" { -1 } else { 1 };
    let hours: i32 = offset[1..3].parse().unwrap_or(0);
    let minutes: i32 = offset[4..6].parse().unwrap_or(0);
    let fixed = FixedOffset::east_opt(sign * (hours * 3600 + minutes * 60))
        .ok_or_else(|| Error::Invalid(format!("invalid timezone offset '{offset}'")))?;
    match fixed.from_local_datetime(&value) {
        LocalResult::Single(datetime) => Ok(datetime.to_rfc3339()),
        _ => Err(Error::Invalid("capture time is ambiguous".into())),
    }
}

fn parse_iso_time(value: &str) -> Result<DateTime<FixedOffset>, String> {
    DateTime::parse_from_rfc3339(value.trim())
        .map_err(|_| format!("invalid proposed_time '{value}'; expected ISO 8601 with an offset"))
}

fn source_name(path: &Path, exif: &ExifMetadata) -> String {
    let camera = [exif.make.as_deref(), exif.model.as_deref()]
        .into_iter()
        .flatten()
        .collect::<Vec<_>>()
        .join(" ");
    if !camera.trim().is_empty() {
        return camera.split_whitespace().collect::<Vec<_>>().join(" ");
    }
    let lower = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if lower.contains("whatsapp") {
        "WhatsApp".into()
    } else if lower.contains("signal") {
        "Signal".into()
    } else if lower.contains("telegram") {
        "Telegram".into()
    } else {
        path.parent()
            .and_then(|p| p.file_name())
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown source")
            .to_string()
    }
}

fn sidecar_path(original: &Path) -> PathBuf {
    let mut name = original.as_os_str().to_os_string();
    name.push(".xmp");
    PathBuf::from(name)
}

fn xmp_document(record: &ReviewRecord) -> String {
    let timestamp = xml_escape(&record.proposed_time);
    let source = xml_escape(&record.inference);
    format!(
        r#"<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:exif="http://ns.adobe.com/exif/1.0/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:ccr="https://capture-clock-repair.sociobot.in/ns/1.0/" exif:DateTimeOriginal="{timestamp}" xmp:MetadataDate="{created}" ccr:Inference="{source}" ccr:Confidence="{confidence}" ccr:Inferred="true"/>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
"#,
        created = Utc::now().to_rfc3339(),
        confidence = xml_escape(&record.confidence)
    )
}

fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
fn sha256(data: &[u8]) -> String {
    format!("{:x}", Sha256::digest(data))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn extracts_common_filename_clocks() {
        assert_eq!(
            timestamp_from_filename("IMG_20250418_194211")
                .unwrap()
                .to_string(),
            "2025-04-18 19:42:11"
        );
        assert_eq!(
            timestamp_from_filename("WhatsApp Image 2025-04-18 at 19.42.11")
                .unwrap()
                .to_string(),
            "2025-04-18 19:42:11"
        );
    }

    #[test]
    fn scan_apply_and_undo_sidecar_without_touching_original() {
        let archive = tempdir().unwrap();
        let photo = archive.path().join("IMG_20250418_194211.jpg");
        fs::write(&photo, b"not exif, still a messenger jpeg").unwrap();
        let output = archive.path().join("review");
        let plan = scan_archive(
            archive.path(),
            ScanOptions {
                recursive: false,
                timezone: "+05:30".into(),
            },
        )
        .unwrap();
        assert_eq!(plan.summary.proposed, 1);
        assert_eq!(plan.records[0].proposed_time, "2025-04-18T19:42:11+05:30");
        write_plan(&plan, &output).unwrap();
        let before = fs::read(&photo).unwrap();
        let manifest = output.join("undo.json");
        let result = apply_review(output.join("review.csv"), &manifest, false).unwrap();
        assert_eq!(result.created, 1);
        assert!(photo.with_file_name("IMG_20250418_194211.jpg.xmp").exists());
        assert_eq!(fs::read(&photo).unwrap(), before);
        let undone = undo_manifest(manifest, false).unwrap();
        assert_eq!(undone.removed, 1);
        assert!(!photo.with_file_name("IMG_20250418_194211.jpg.xmp").exists());
    }

    #[test]
    fn apply_refuses_to_overwrite_sidecar() {
        let archive = tempdir().unwrap();
        let photo = archive.path().join("20250102_030405.jpg");
        fs::write(&photo, b"photo").unwrap();
        let plan = scan_archive(archive.path(), ScanOptions::default()).unwrap();
        let output = archive.path().join("review");
        write_plan(&plan, &output).unwrap();
        fs::write(photo.with_file_name("20250102_030405.jpg.xmp"), b"mine").unwrap();
        let error =
            apply_review(output.join("review.csv"), output.join("undo.json"), false).unwrap_err();
        assert_eq!(error.exit_code(), 2);
    }
}
