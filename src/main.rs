use capture_clock_repair::{
    Error, ScanOptions, apply_review, scan_archive, undo_manifest, validate_offset, write_plan,
};
use clap::{Parser, Subcommand};
use serde::Serialize;
use std::path::PathBuf;

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
    /// Inspect an archive and write review.csv plus plan.json
    Scan {
        /// Folder containing the photo archive
        archive: PathBuf,
        /// Folder to receive review.csv and plan.json
        #[arg(short, long, default_value = "clock-review")]
        output: PathBuf,
        /// Offset used only for filename-inferred local times (+HH:MM or -HH:MM)
        #[arg(long, default_value = "+00:00", value_parser = parse_offset)]
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
    match Cli::parse().command {
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
