/**
 * UserSession Model
 * Defines the structure of UserSession documents in MongoDB using Mongoose.
 * Sessions are identified by a UUID (sessionId) and expire after 24 hours via a TTL index.
 * No account creation is required — the client stores the sessionId locally.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export {
    APPLICANT_TYPES,
    EMPLOYMENT_STATUSES,
    CITIZENSHIP_STATUSES,
    FLAT_TYPE_PREFERENCES,
    REGIONS,
    type ApplicantType,
    type EmploymentStatus,
    type CitizenshipStatus,
    type FlatTypePreference,
    type Region,
} from '../../constants';
import {
    APPLICANT_TYPES,
    EMPLOYMENT_STATUSES,
    CITIZENSHIP_STATUSES,
    FLAT_TYPE_PREFERENCES,
    REGIONS,
    type ApplicantType,
    type EmploymentStatus,
    type CitizenshipStatus,
    type FlatTypePreference,
    type Region,
} from '../../constants';

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

const UserSession: Model<IUserSession> = mongoose.model<IUserSession>(
    'UserSession',
    UserSessionSchema
);

export default UserSession;
