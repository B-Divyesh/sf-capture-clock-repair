use capture_clock_repair::{
    Error, ScanOptions, apply_review, scan_archive, undo_manifest, validate_offset, write_plan,
};
use clap::{Parser, Subcommand};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
#[command(
    name = "capture-clock-repair",
    version,
    about = "Build a conservative, reversible capture-time repair plan",
    long_about = "Inspect JPEG archives for missing or conflicting capture clocks, create an editable review CSV, and write only approved XMP sidecars. Originals are never modified."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Run the complete scan workflow on bundled sample photos
    Demo {
        /// New folder to receive the isolated sample workspace
        #[arg(short, long)]
        output: Option<PathBuf>,
        /// Print the result as JSON
        #[arg(long)]
        json: bool,
    },
    /// Inspect an archive and write review.csv plus plan.json
    Scan {
        /// Folder containing the photo archive
        archive: PathBuf,
        /// Folder to receive review.csv and plan.json
        #[arg(short, long, default_value = "clock-review")]
        output: PathBuf,
        /// Offset used only for filename-inferred local times (+HH:MM or -HH:MM)
        #[arg(
            long,
            default_value = "+00:00",
            value_parser = parse_offset,
            allow_hyphen_values = true
        )]
        timezone: String,
        /// Inspect only the named folder, not its descendants
        #[arg(long)]
        no_recursive: bool,
        /// Print the complete plan as JSON
        #[arg(long)]
        json: bool,
    },
    /// Create XMP sidecars for accept/amend rows in a review CSV
    Apply {
        /// Edited review.csv from the scan command
        review: PathBuf,
        /// Undo manifest to create
        #[arg(short, long, default_value = "clock-review/undo.json")]
        manifest: PathBuf,
        /// Validate and list writes without creating anything
        #[arg(long)]
        dry_run: bool,
        /// Print the result as JSON
        #[arg(long)]
        json: bool,
    },
    /// Remove unchanged sidecars created by an undo manifest
    Undo {
        /// undo.json created by the apply command
        manifest: PathBuf,
        /// Validate and count removals without deleting anything
        #[arg(long)]
        dry_run: bool,
        /// Print the result as JSON
        #[arg(long)]
        json: bool,
    },
}

#[derive(Serialize)]
struct DemoResult {
    mode: &'static str,
    workspace: String,
    archive: String,
    review_csv: String,
    plan_json: String,
    summary: capture_clock_repair::Summary,
}

fn demo_workspace(output: Option<PathBuf>) -> Result<PathBuf, Error> {
    let workspace = output.unwrap_or_else(|| {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        std::env::temp_dir().join(format!(
            "capture-clock-repair-demo-{}-{nonce}",
            std::process::id()
        ))
    });
    if workspace.exists() {
        return Err(Error::Invalid(format!(
            "demo output '{}' already exists; choose a new folder",
            workspace.display()
        )));
    }
    Ok(workspace)
}

fn run_demo(output: Option<PathBuf>) -> Result<DemoResult, Error> {
    let workspace = demo_workspace(output)?;
    let archive = workspace.join("sample-archive");
    let review = workspace.join("clock-review");
    fs::create_dir_all(&archive)?;
    for (name, contents) in [
        (
            "WhatsApp Image 2025-04-18 at 19.42.11.jpg",
            include_bytes!("../examples/sample-archive/WhatsApp Image 2025-04-18 at 19.42.11.jpg")
                .as_slice(),
        ),
        (
            "IMG_20250703_081522.jpg",
            include_bytes!("../examples/sample-archive/IMG_20250703_081522.jpg").as_slice(),
        ),
        (
            "summer-evening.jpg",
            include_bytes!("../examples/sample-archive/summer-evening.jpg").as_slice(),
        ),
        (
            "trip-export.png",
            include_bytes!("../examples/sample-archive/trip-export.png").as_slice(),
        ),
    ] {
        fs::write(archive.join(name), contents)?;
    }
    let plan = scan_archive(
        &archive,
        ScanOptions {
            recursive: true,
            timezone: "+05:30".into(),
        },
    )?;
    write_plan(&plan, &review)?;
    Ok(DemoResult {
        mode: "demo — bundled sample data",
        workspace: workspace.to_string_lossy().into_owned(),
        archive: archive.to_string_lossy().into_owned(),
        review_csv: review.join("review.csv").to_string_lossy().into_owned(),
        plan_json: review.join("plan.json").to_string_lossy().into_owned(),
        summary: plan.summary,
    })
}

fn parse_offset(value: &str) -> Result<String, String> {
    validate_offset(value)
        .map(|_| value.to_string())
        .map_err(|error| error.to_string())
}

fn print_json<T: Serialize>(value: &T) -> Result<(), Error> {
    println!("{}", serde_json::to_string_pretty(value)?);
    Ok(())
}

fn run() -> Result<(), Error> {
    let cli = match Cli::try_parse() {
        Ok(cli) => cli,
        Err(error)
            if matches!(
                error.kind(),
                clap::error::ErrorKind::DisplayHelp | clap::error::ErrorKind::DisplayVersion
            ) =>
        {
            error.print().map_err(Error::Io)?;
            return Ok(());
        }
        Err(error) => return Err(Error::Invalid(error.to_string())),
    };
    match cli.command {
        Command::Demo { output, json } => {
            let result = run_demo(output)?;
            if json {
                print_json(&result)?;
            } else {
                println!("Demo — sample data in an isolated temporary workspace.");
                println!(
                    "Examined {} JPEGs across {} source group(s): {} proposed, {} need review, {} unsupported.",
                    result.summary.examined,
                    result.summary.sources,
                    result.summary.proposed,
                    result.summary.review,
                    result.summary.unsupported
                );
                println!("Review CSV: {}", result.review_csv);
                println!("Plan JSON: {}", result.plan_json);
                println!("Workspace: {}", result.workspace);
                println!("No personal photos or existing files were read or changed.");
            }
        }
        Command::Scan {
            archive,
            output,
            timezone,
            no_recursive,
            json,
        } => {
            let plan = scan_archive(
                archive,
                ScanOptions {
                    recursive: !no_recursive,
                    timezone,
                },
            )?;
            write_plan(&plan, &output)?;
            if json {
                print_json(&plan)?;
            } else {
                println!(
                    "Examined {} JPEGs across {} source group(s).",
                    plan.summary.examined, plan.summary.sources
                );
                println!(
                    "{} trusted · {} proposed · {} need review · {} unsupported",
                    plan.summary.trusted,
                    plan.summary.proposed,
                    plan.summary.review,
                    plan.summary.unsupported
                );
                println!("Review: {}", output.join("review.csv").display());
                println!("No original files were changed.");
            }
        }
        Command::Apply {
            review,
            manifest,
            dry_run,
            json,
        } => {
            let result = apply_review(review, &manifest, dry_run)?;
            if json {
                print_json(&result)?;
            } else if dry_run {
                println!(
                    "Dry run: {} sidecar(s) ready; {} row(s) skipped.",
                    result.created, result.skipped
                );
            } else {
                println!(
                    "Created {} sidecar(s). Undo manifest: {}",
                    result.created,
                    manifest.display()
                );
            }
        }
        Command::Undo {
            manifest,
            dry_run,
            json,
        } => {
            let result = undo_manifest(manifest, dry_run)?;
            if json {
                print_json(&result)?;
            } else if dry_run {
                println!(
                    "Dry run: {} unchanged sidecar(s) can be removed; {} already absent.",
                    result.removed, result.skipped
                );
            } else {
                println!(
                    "Removed {} unchanged sidecar(s); {} already absent.",
                    result.removed, result.skipped
                );
            }
        }
    }
    Ok(())
}

fn main() {
    if let Err(error) = run() {
        if std::env::args_os().any(|argument| argument == "--json") {
            eprintln!(
                "{}",
                serde_json::json!({ "error": error.to_string(), "exit_code": error.exit_code() })
            );
        } else {
            eprintln!("capture-clock-repair: {error}");
        }
        std::process::exit(error.exit_code());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scan_accepts_a_separated_negative_timezone_offset() {
        let cli = Cli::try_parse_from([
            "capture-clock-repair",
            "scan",
            "./archive",
            "--timezone",
            "-04:00",
        ])
        .expect("the documented separated negative offset should parse");

        let Command::Scan { timezone, .. } = cli.command else {
            panic!("expected scan command");
        };
        assert_eq!(timezone, "-04:00");
    }
}
