/**
 * ApplicationRate model definition using Mongoose
 * Defines schema and model for application rates data
 * Fields include launch code, estate, project group, flat type, number of units, number of applicants, application rates for different categories, and timestamps
 * Indexes are set on launch code, estate, and flat type for efficient querying
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApplicationRate extends Document {
    launchCode: string;
    estate: string;
    projectGroup: string;
    projectCodes: string[];
    flatType: string;
    noOfUnits: number;
    noOfApplicants: number;
    seniorsAppRate: number | null;
    firstTimerFamiliesAppRate: number | null;
    firstTimerSinglesAppRate: number | null;
    secondTimerFamiliesAppRate: number | null;
    overallAppRate: number | null; // number of applicants / number of units
    sourceAsOf: string | null; // source date of data retrieved
    lastVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Schemas
 */
// Schema for application rates data
const ApplicationRateSchema = new Schema<IApplicationRate>(
    {
        launchCode: { type: String, required: true, index: true },
        estate: { type: String, required: true, index: true },
        projectGroup: { type: String, required: true },
        projectCodes: { type: [String], required: true, index: true },
        flatType: { type: String, required: true, index: true },
        noOfUnits: { type: Number, required: true },
        noOfApplicants: { type: Number, required: true },
        seniorsAppRate: { type: Number, default: null },
        firstTimerFamiliesAppRate: { type: Number, default: null },
        firstTimerSinglesAppRate: { type: Number, default: null },
        secondTimerFamiliesAppRate: { type: Number, default: null },
        overallAppRate: { type: Number, default: null },
        sourceAsOf: { type: String, default: null },
        lastVerifiedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Compound the index to ensure uniqueness of application rate data
ApplicationRateSchema.index({ launchCode: 1, estate: 1, flatType: 1 }, { unique: true });

const ApplicationRate: Model<IApplicationRate> = mongoose.model<IApplicationRate>(
    'ApplicationRate',
    ApplicationRateSchema
);

export default ApplicationRate;
