/**
 * UserSession Model
 * Defines the structure of UserSession documents in MongoDB using Mongoose.
 * Sessions are identified by a UUID (sessionId) and expire after 24 hours via a TTL index.
 * No account creation is required — the client stores the sessionId locally.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

/* ─── Enums ────────────────────────────────────────────────────────────── */

export const APPLICANT_TYPES = ["single", "couple"] as const;
export const EMPLOYMENT_STATUSES = ["employed", "self-employed", "student", "nsf"] as const;
export const CITIZENSHIP_STATUSES = ["SC", "SC/SC", "SC/PR"] as const;
export const FLAT_TYPE_PREFERENCES = ["2-Room Flexi", "3-Room", "4-Room", "5-Room", "3Gen"] as const;
export const REGIONS = [
    "Ang Mo Kio", "Bedok", "Bishan", "Bukit Batok", "Bukit Merah",
    "Bukit Panjang", "Choa Chu Kang", "Clementi", "Geylang", "Hougang",
    "Jurong East", "Jurong West", "Kallang/Whampoa", "Marine Parade",
    "Pasir Ris", "Punggol", "Queenstown", "Sembawang", "Sengkang",
    "Serangoon", "Tampines", "Tengah", "Toa Payoh", "Woodlands", "Yishun"
] as const;

export type ApplicantType = typeof APPLICANT_TYPES[number];
export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];
export type CitizenshipStatus = typeof CITIZENSHIP_STATUSES[number];
export type FlatTypePreference = typeof FLAT_TYPE_PREFERENCES[number];
export type Region = typeof REGIONS[number];

/* ─── Interface ────────────────────────────────────────────────────────── */

export interface IUserSession extends Document {
    sessionId: string;

    /* Step 1 – Demographics */
    applicantType?: ApplicantType;
    age?: number;
    partnerAge?: number;
    citizenship?: CitizenshipStatus;
    firstTimer?: boolean;

    /* Step 2 – Financials */
    employmentStatus?: EmploymentStatus;
    monthlyIncome?: number;
    partnerMonthlyIncome?: number;
    cpfOA?: number;
    cashSavings?: number;

    /* Step 3 – Preferences */
    preferredFlatTypes?: FlatTypePreference[];
    preferredRegions?: Region[];
    maxBudget?: number;

    /* Derived — set server-side, never accepted from client */
    deferredIncomeAssessment: boolean;

    /* TTL */
    expiresAt: Date;
}

/* ─── Schema ───────────────────────────────────────────────────────────── */

const UserSessionSchema = new Schema<IUserSession>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },

        applicantType: { type: String, enum: APPLICANT_TYPES, default: null },
        age: { type: Number, default: null },
        partnerAge: { type: Number, default: null },
        citizenship: { type: String, enum: CITIZENSHIP_STATUSES, default: null },
        firstTimer: { type: Boolean, default: null },

        employmentStatus: { type: String, enum: EMPLOYMENT_STATUSES, default: null },
        monthlyIncome: { type: Number, default: null },
        partnerMonthlyIncome: { type: Number, default: null },
        cpfOA: { type: Number, default: null },
        cashSavings: { type: Number, default: null },

        preferredFlatTypes: { type: [String], enum: FLAT_TYPE_PREFERENCES, default: [] },
        preferredRegions: { type: [String], enum: REGIONS, default: [] },
        maxBudget: { type: Number, default: null },

        deferredIncomeAssessment: { type: Boolean, required: true, default: false },

        expiresAt: { type: Date, required: true, index: { expires: 0 } },
    },
    { timestamps: true }
);

/* ─── Model ────────────────────────────────────────────────────────────── */

const UserSession: Model<IUserSession> = mongoose.model<IUserSession>("UserSession", UserSessionSchema);

export default UserSession;
