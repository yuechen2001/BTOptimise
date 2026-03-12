/**
 * Import application rates from CSV file into MongoDB
 * 
 * Reads application rates data, process it and then uploads to MongoDB using the ApplicationRate model.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";
import ApplicationRate from "../modules/applicationRates/applicationRate.model";

dotenv.config();

/**
 * Interfaces
 */
interface CsvRow {
    launch_code?: string;
    estate?: string;
    project_group?: string;
    project_codes?: string;
    flat_type?: string;
    no_of_units?: string;
    no_of_applicants?: string;
    seniors_app_rate?: string;
    first_timer_families_app_rate?: string;
    first_timer_singles_app_rate?: string;
    second_timer_families_app_rate?: string;
    overall_app_rate?: string;
    source_as_of?: string;
    last_verified_at?: string;
}

/**
 * Utility functions to trim data and parse them
 */
// Trims the string and returns null if the value is undefined, null, or an empty string after trimming.
function safeTrim(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    const trimmed = String(value).trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Parses the string to convert it into a number if the field is a number
 */
function parseNumber(value: unknown): number | null {
    const trimmed = safeTrim(value);

    if (trimmed === null) {
        return null;
    }

    const cleaned = trimmed.replace(/[^0-9.]/g, "");
    return cleaned ? Number(cleaned) : null;
}

/**
 * Parses a date string in the format "DD/MM/YYYY" and returns a date object.
 */
function parseDateDDMMYYYY(value: unknown): Date | null {
    const v = safeTrim(value);
    if (!v) {
        return null;
    }

    const datePart = v.split(" ")[0];
    const parts = datePart.split("/");

    if (parts.length !== 3) {
        return null;
    }

    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) {
        return null;
    }

    return new Date(year, month - 1, day);
}

/**
 * Parses the project codes string, splitting by "|" and trimming each code.
 * It then returns an array of project codes.
 * Due to the nature of application rates provided by HDB, there are projects grouped together for particular flat types.
 */
function parseProjectCodes(value: unknown): string[] {
    const trimmed = safeTrim(value);
    if (!trimmed) {
        return [];
    }

    return trimmed.split("|").map((code) => code.trim()).filter(Boolean);
}

/**
 *  Reads the CSV file and then returns an array of rows.
 */
async function readCsv(filePath: string): Promise<CsvRow[]> {
    const rows: CsvRow[] = [];

    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath).pipe(csv())
            .on("data", (row: CsvRow) => rows.push(row))
            .on("end", () => resolve())
            .on("error", reject);
    });

    return rows;
}

async function run(): Promise<void> {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoURI, {
        family: 4,
        serverSelectionTimeoutMS: 30000
    });

    console.log("Connected to MongoDB");

    const filePath = path.join(__dirname, "../../data/application_rates.csv");
    const rows = await readCsv(filePath);

    let importedCount = 0;

    for (const row of rows) {
        const launchCode = safeTrim(row.launch_code);
        const estate = safeTrim(row.estate);
        const projectGroup = safeTrim(row.project_group);
        const projectCodes = parseProjectCodes(row.project_codes);
        const flatType = safeTrim(row.flat_type);
        const noOfUnits = parseNumber(row.no_of_units);
        const noOfApplicants = parseNumber(row.no_of_applicants);

        if (!launchCode || !estate || !projectGroup || !flatType || noOfUnits === null || noOfApplicants === null) {
            console.warn("Skipping incomplete row:", row);
            continue;
        }

        // Update existing document if it exists, otherwise create a new one
        await ApplicationRate.updateOne(
            { launchCode, projectGroup, flatType },
            {
                $set: {
                    launchCode,
                    estate,
                    projectGroup,
                    projectCodes,
                    flatType,
                    noOfUnits,
                    noOfApplicants,
                    seniorsAppRate: parseNumber(row.seniors_app_rate),
                    firstTimerFamiliesAppRate: parseNumber(row.first_timer_families_app_rate),
                    firstTimerSinglesAppRate: parseNumber(row.first_timer_singles_app_rate),
                    secondTimerFamiliesAppRate: parseNumber(row.second_timer_families_app_rate),
                    overallAppRate: parseNumber(row.overall_app_rate),
                    sourceAsOf: safeTrim(row.source_as_of),
                    lastVerifiedAt: parseDateDDMMYYYY(row.last_verified_at)
                }
            },
            { upsert: true, runValidators: true }
        );

        importedCount += 1;
    }

    console.log(`Imported ${importedCount} application rate rows`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
}

void run().catch(async (err) => {
    console.error("Import failed:", err);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});
