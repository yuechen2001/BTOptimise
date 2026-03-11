/**
 * Project Model
 * Defines the structure of the Project documents in MongoDB using Mongoose.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Interfaces
 */

/**
 * IFlatType represents the structure of each flat type within a project, including details such as floor area and price range.
 */
export interface IFlatType {
    type: string;
    estimatedFloorArea: number | null;
    estimatedInternalFloorArea: number | null;
    minIndicativePrice: number | null;
    maxIndicativePrice: number | null;
    unitCount: number | null;
}

/**
 * IProject represents the structure of a project document in MongoDB.
 */
export interface IProject extends Document {
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
 * Schemas
 */
const FlatTypeSchema = new Schema<IFlatType>(
    {
        type: { type: String, required: true },
        estimatedFloorArea: { type: Number, default: null },
        estimatedInternalFloorArea: { type: Number, default: null },
        minIndicativePrice: { type: Number, default: null },
        maxIndicativePrice: { type: Number, default: null },
        unitCount: { type : Number, default: null }
    },
    { _id: false }
);

const ProjectSchema = new Schema<IProject>(
    {
        projectCode: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, index: true},
        estate: { type: String, required: true, index: true },
        classification: {
            type: String,
            required: true,
            enum: ["Standard", "Plus", "Prime"]
        },
        launchdate: {type: Date, default: null },
        estimatedCompletion: {type: String, default: null },
        flatTypes: { type: [FlatTypeSchema], default: [] },
        lastVerifiedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

/**
 * Adding indexes to optimize queries based on estate, classification, and flat type.
 */
ProjectSchema.index({ estate: 1, classification: 1 });
ProjectSchema.index({ "flatTypes.type": 1});

const Project: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema);

export default Project;