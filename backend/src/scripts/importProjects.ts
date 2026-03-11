/**
 * Import Projects Script
 * This script reads project data from CSV files
 * and imports it into the MongoDB database using the Project model.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";
import Project, { IFlatType } from "../modules/projectCatalog/project.model";

dotenv.config();

/**
 * Interfaces
 */
interface CsvRow {
    project_code?: string;
    name?: string;
    estate?: string;
    classification?: string;
    launch_date?: string;
    estimated_completion?: string;
    flat_type?: string;
    estimated_floor_area?: string;
    estimated_internal_floor_area?: string;
    min_indicative_price_range?: string;
    max_indicative_price_range?: string;
    unit_count?: string;
    last_verified_at?: string;
}

interface GroupedProject {
    projectCode: string;
    name: string;
    estate: string;
    classification: "Standard" | "Plus" | "Prime";
    launchdate: Date | null;
    estimatedCompletion: string | null;
    flatTypes: IFlatType[];
    lastVerifiedAt: Date | null;
}

/**
 * Utility functions for parsing CSV data
 */
/**
 * Parse string and trims the string.
 */
function safeTrim(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    const trimmed = String(value).trim();  
    return trimmed === "" ? null : trimmed;
}

/**
 * Parses a string value to a number, removing any non-numeric characters.
 */
function parseNumber(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }

    const cleaned = String(value).replace(/[^0-9.]/g, "");
    return cleaned === "" ? null : Number(cleaned);
}

/**
 * Parses a date string in the format "DD/MM/YYYY" and returns a Date object.
 */
function parseDateDDMMYYYY(value: unknown): Date | null {
    const v = safeTrim(value);
    if (!v) {
        return null;
    }

    const parts = v.split("/");
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
 * Reads the CSV file and returns an array of rows as objects.
 */
async function readCSV(filePath: string): Promise<CsvRow[]> {
    const rows: CsvRow[] = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject)
    });

    return rows;
}

/**
 * Main function to run the import process:
 * - Connects to MongoDB using the MONGO_URI from environment variables.
 * - Reads project data from the specified CSV file.
 */
async function run(): Promise<void> {
    const mongoURI = process.env.MONGO_URI;
    console.log("Loaded MONGO_URI:", mongoURI);

    if (!mongoURI) {
        throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(mongoURI, {
        family: 4,
        serverSelectionTimeoutMS: 30000
    });
    console.log("Connected to MongoDB");

    const filePath = path.join(__dirname, "../../data/projects.csv");
    const rows = await readCSV(filePath);

    if (!rows.length) {
        console.log("No data found in CSV");
        await mongoose.disconnect();
        return;
    }

    const groupedProjects = new Map();

    // Group rows by project code to aggregate flat types under the same project
    for (const row of rows) {
        const projectCode = safeTrim(row.project_code);
        const name = safeTrim(row.name);
        const estate = safeTrim(row.estate);
        const classification = safeTrim(row.classification) as "Standard" | "Plus" | "Prime" | null;
        const launchdate = parseDateDDMMYYYY(row.launch_date);
        const estimatedCompletion = safeTrim(row.estimated_completion);
        const lastVerifiedAt = parseDateDDMMYYYY(row.last_verified_at);

        if (!projectCode || !name || !estate || !classification) {
            console.warn("Skipping incomplete row:", row); ;
            continue;
        }

        // If the project code is not already in the map, add it with the basic project info
        if (!groupedProjects.has(projectCode)) {
            groupedProjects.set(projectCode, {
                projectCode,
                name,
                estate,
                classification,
                launchdate,
                estimatedCompletion,
                flatTypes: [],
                lastVerifiedAt
            });
        }

        // Add the flat type information to the corresponding project in the map
        groupedProjects.get(projectCode).flatTypes.push({
            type: safeTrim(row.flat_type) || "Unknown",
            estimatedFloorArea: parseNumber(row.estimated_floor_area),
            estimatedInternalFloorArea: parseNumber(row.estimated_internal_floor_area),
            minIndicativePrice: parseNumber(row.min_indicative_price_range),
            maxIndicativePrice: parseNumber(row.max_indicative_price_range),
            unitCount: parseNumber(row.unit_count)
        });
    }

    let importedCount = 0;

    for (const project of groupedProjects.values()) {
        await Project.updateOne(
            { projectCode: project.projectCode },
            { $set: project },
            { upsert: true, runValidators: true }
        );
        importedCount += 1;
    }
    console.log(`Imported ${importedCount} projects.`);

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