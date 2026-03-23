/**
 * Financial Rules Routes
 *
 * Endpoints:
 * - POST   /api/financial-rules/calculate            Full financial calculation for a BTO purchase
 * - POST   /api/financial-rules/simulate-clawback    Calculate subsidy clawback for Plus/Prime flats
 * - GET    /api/financial-rules/eligibility/:sessionId  Quick eligibility check
 *
 * Implements HDB policy logic including:
 * - Enhanced CPF Housing Grant (EHG)
 * - Maximum HDB loan via MSR
 * - Milestone cash flow requirements
 * - Subsidy clawback projections
 */

import express, { Request, Response } from 'express';
import UserSession from '../userSession/userSession.model';
import {
    calculateFinancials,
    checkEligibility,
    calculateClawback,
    type FinancialCalculationResult,
    type ClawbackResult,
    type EligibilityResult,
} from './financialRules.service';

const router = express.Router();

/* ─── Helpers ──────────────────────────────────────────────────────── */

/**
 * Validates numeric input to ensure it's a positive number.
 */
function validatePositiveNumber(value: unknown, fieldName: string): string | null {
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return `${fieldName} must be a non-negative number`;
    }
    return null;
}

/**
 * Validates that a value is within a reasonable range.
 */
function validateRange(
    value: number,
    fieldName: string,
    min: number,
    max: number
): string | null {
    if (value < min || value > max) {
        return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
}

/* ─── POST /api/financial-rules/calculate ──────────────────────────── */

/**
 * Calculate complete financial breakdown for a BTO purchase.
 * Includes eligibility, grants, loan, cash flow, and affordability.
 */
router.post('/calculate', async (req: Request, res: Response) => {
    try {
        const { sessionId, projectId, flatType, flatPrice } = req.body;

        // Validate required fields
        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required and must be a string',
                errors: [],
            });
        }

        // Fetch user session
        const session = await UserSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
                errors: ['No session found with the provided sessionId'],
            });
        }

        // Validate flatPrice if provided
        let price = flatPrice;
        if (price !== undefined) {
            const priceError = validatePositiveNumber(price, 'flatPrice');
            if (priceError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid flatPrice',
                    errors: [priceError],
                });
            }

            const rangeError = validateRange(price, 'flatPrice', 150000, 800000);
            if (rangeError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid flatPrice range',
                    errors: [rangeError],
                });
            }
        } else {
            // Default price if not provided (for what-if scenarios)
            price = 400000;
        }

        // Determine flat type
        let type = flatType;
        if (!type) {
            // Use first preferred flat type from session if available
            if (session.preferredFlatTypes && session.preferredFlatTypes.length > 0) {
                type = session.preferredFlatTypes[0];
            } else {
                type = '4-Room'; // Default
            }
        }

        // Perform financial calculation
        const result: FinancialCalculationResult = calculateFinancials(session, price, type);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error in /calculate:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during financial calculation',
            errors: [(error as Error).message],
        });
    }
});

/* ─── POST /api/financial-rules/simulate-clawback ──────────────────── */

/**
 * Calculate subsidy clawback for Plus and Prime flats.
 * Shows how much subsidy needs to be returned based on holding period.
 */
router.post('/simulate-clawback', async (req: Request, res: Response) => {
    try {
        const { projectType, purchasePrice, marketValue, yearsBeforeSale } = req.body;

        // Validate projectType
        if (!projectType || !['Standard', 'Plus', 'Prime'].includes(projectType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid projectType',
                errors: ['projectType must be one of: Standard, Plus, Prime'],
            });
        }

        // Validate purchasePrice
        const purchasePriceError = validatePositiveNumber(purchasePrice, 'purchasePrice');
        if (purchasePriceError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid purchasePrice',
                errors: [purchasePriceError],
            });
        }

        // Validate marketValue
        const marketValueError = validatePositiveNumber(marketValue, 'marketValue');
        if (marketValueError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid marketValue',
                errors: [marketValueError],
            });
        }

        // Validate yearsBeforeSale
        const yearsError = validatePositiveNumber(yearsBeforeSale, 'yearsBeforeSale');
        if (yearsError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid yearsBeforeSale',
                errors: [yearsError],
            });
        }

        const yearsRangeError = validateRange(yearsBeforeSale, 'yearsBeforeSale', 0, 15);
        if (yearsRangeError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid yearsBeforeSale range',
                errors: [yearsRangeError],
            });
        }

        // Calculate clawback
        const result: ClawbackResult = calculateClawback(
            projectType,
            purchasePrice,
            marketValue,
            yearsBeforeSale
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error in /simulate-clawback:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during clawback calculation',
            errors: [(error as Error).message],
        });
    }
});

/* ─── GET /api/financial-rules/eligibility/:sessionId ───────────────── */

/**
 * Quick eligibility check without full calculation.
 * Checks citizenship, income ceiling, and first-timer status.
 */
router.get('/eligibility/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required',
                errors: [],
            });
        }

        // Fetch user session
        const session = await UserSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
                errors: ['No session found with the provided sessionId'],
            });
        }

        // Perform eligibility check
        const result: EligibilityResult = checkEligibility(session);

        return res.status(200).json({
            success: true,
            data: {
                eligible: result.canPurchaseBTO,
                checks: {
                    citizenship: session.citizenship ? ['SC/SC', 'SC/PR'].includes(session.citizenship) : false,
                    incomeCeiling: result.incomeCeilingCheck,
                    firstTimer: session.firstTimer || false,
                },
                reasons: result.reasons,
            },
        });
    } catch (error) {
        console.error('Error in /eligibility:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during eligibility check',
            errors: [(error as Error).message],
        });
    }
});

export default router;
