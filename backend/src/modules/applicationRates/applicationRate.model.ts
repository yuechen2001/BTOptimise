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
    overallAppRate: number | null;
    sourceAsOf: string | null;
    lastVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Schemas
 */
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

ApplicationRateSchema.index({ launchCode: 1, estate: 1, flatType: 1 }, { unique: true });

const ApplicationRate: Model<IApplicationRate> = mongoose.model<IApplicationRate>(
    'ApplicationRate',
    ApplicationRateSchema
);

export default ApplicationRate;
