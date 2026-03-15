/**
 * UserSession Routes
 *
 * Endpoints:
 * - POST   /api/sessions            Create a new session; returns sessionId
 * - GET    /api/sessions/:sessionId Retrieve a session by sessionId
 * - PATCH  /api/sessions/:sessionId Update profile fields (partial, step-by-step)
 * - DELETE /api/sessions/:sessionId Delete a session
 *
 * Sessions expire automatically after 24 hours via MongoDB TTL index.
 * No authentication is required; the client stores the sessionId locally.
 */
import express, { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import UserSession from "./userSession.model";
import {
    APPLICANT_TYPES,
    CITIZENSHIP_STATUSES,
    EMPLOYMENT_STATUSES,
    FLAT_TYPE_PREFERENCES,
    REGIONS,
    SESSION_TTL_MS,
} from "../../constants";

const router = express.Router();

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/** Returns true if the employment status qualifies for deferred income assessment. */
function isDeferredIncome(employmentStatus?: string): boolean {
    return employmentStatus === "student" || employmentStatus === "nsf";
}

/** Validates and sanitises the profile fields that may appear in POST / PATCH bodies.
 *  Returns an error message string if validation fails, or null if all provided fields are valid. */
function validateProfileFields(body: Record<string, unknown>): string | null {
    const {
        applicantType, age, partnerAge, citizenship, firstTimer,
        employmentStatus, monthlyIncome, partnerMonthlyIncome, cpfOA, cashSavings,
        preferredFlatTypes, preferredRegions, maxBudget,
    } = body;

    if (applicantType !== undefined && !APPLICANT_TYPES.includes(applicantType as never)) {
        return `applicantType must be one of: ${APPLICANT_TYPES.join(", ")}`;
    }

    if (age !== undefined) {
        if (typeof age !== "number" || !Number.isInteger(age) || age < 21) {
            return "age must be an integer ≥ 21";
        }
    }

    if (partnerAge !== undefined) {
        if (typeof partnerAge !== "number" || !Number.isInteger(partnerAge) || partnerAge < 21) {
            return "partnerAge must be an integer ≥ 21";
        }
    }

    if (applicantType === "couple" && partnerAge === undefined && body.partnerAge === undefined) {
        // Only enforce this on full submission — allow partial PATCH to omit it
    }

    if (citizenship !== undefined && !CITIZENSHIP_STATUSES.includes(citizenship as never)) {
        return `citizenship must be one of: ${CITIZENSHIP_STATUSES.join(", ")}`;
    }

    if (firstTimer !== undefined && typeof firstTimer !== "boolean") {
        return "firstTimer must be a boolean";
    }

    if (employmentStatus !== undefined && !EMPLOYMENT_STATUSES.includes(employmentStatus as never)) {
        return `employmentStatus must be one of: ${EMPLOYMENT_STATUSES.join(", ")}`;
    }

    for (const [key, val] of Object.entries({ monthlyIncome, partnerMonthlyIncome, cpfOA, cashSavings, maxBudget })) {
        if (val !== undefined && (typeof val !== "number" || val < 0)) {
            return `${key} must be a non-negative number`;
        }
    }

    if (preferredFlatTypes !== undefined) {
        if (!Array.isArray(preferredFlatTypes)) return "preferredFlatTypes must be an array";
        const invalid = (preferredFlatTypes as unknown[]).filter(f => !FLAT_TYPE_PREFERENCES.includes(f as never));
        if (invalid.length > 0) return `Invalid flat types: ${invalid.join(", ")}`;
    }

    if (preferredRegions !== undefined) {
        if (!Array.isArray(preferredRegions)) return "preferredRegions must be an array";
        const invalid = (preferredRegions as unknown[]).filter(r => !REGIONS.includes(r as never));
        if (invalid.length > 0) return `Invalid regions: ${invalid.join(", ")}`;
    }

    return null;
}

/** Fields that are allowed in from the client. deferredIncomeAssessment and expiresAt are server-controlled. */
const ALLOWED_FIELDS = [
    "applicantType", "age", "partnerAge", "citizenship", "firstTimer",
    "employmentStatus", "monthlyIncome", "partnerMonthlyIncome", "cpfOA", "cashSavings",
    "preferredFlatTypes", "preferredRegions", "maxBudget",
];

function pickAllowedFields(body: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    );
}

/* ─── POST /api/sessions ───────────────────────────────────────────────── */

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as Record<string, unknown>;

        const validationError = validateProfileFields(body);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const fields = pickAllowedFields(body);
        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        const deferredIncomeAssessment = isDeferredIncome(fields.employmentStatus as string | undefined);

        const session = await UserSession.create({
            sessionId,
            ...fields,
            deferredIncomeAssessment,
            expiresAt,
        });

        return res.status(201).json({
            success: true,
            data: session,
        });
    } catch (err) {
        next(err);
    }
});

/* ─── GET /api/sessions/:sessionId ────────────────────────────────────── */

router.get("/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await UserSession.findOne({ sessionId: req.params.sessionId }).lean();

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found or expired" });
        }

        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
});

/* ─── PATCH /api/sessions/:sessionId ──────────────────────────────────── */

router.patch("/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as Record<string, unknown>;

        const validationError = validateProfileFields(body);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const fields = pickAllowedFields(body);

        // Re-derive deferredIncomeAssessment if employmentStatus is being updated
        const update: Record<string, unknown> = { ...fields };
        if ("employmentStatus" in fields) {
            update.deferredIncomeAssessment = isDeferredIncome(fields.employmentStatus as string | undefined);
        }

        const session = await UserSession.findOneAndUpdate(
            { sessionId: req.params.sessionId },
            { $set: update },
            { returnDocument: "after", runValidators: true }
        ).lean();

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found or expired" });
        }

        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
});

/* ─── DELETE /api/sessions/:sessionId ─────────────────────────────────── */

router.delete("/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await UserSession.findOneAndDelete({ sessionId: req.params.sessionId });

        if (!result) {
            return res.status(404).json({ success: false, message: "Session not found or expired" });
        }

        return res.json({ success: true, message: "Session deleted" });
    } catch (err) {
        next(err);
    }
});

export default router;
