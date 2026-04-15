/**
 * Timeline Visualizer Routes
 *
 * API endpoints for timeline projections:
 * - POST /api/timeline/project - Generate timeline projection
 * - GET /api/timeline/optimal-windows - Get grant optimization windows
 * - POST /api/timeline/compare-scenarios - Compare application timing scenarios
 */

import express, { Request, Response, NextFunction } from 'express';
import UserSession from '../userSession/userSession.model';
import {
    projectFinancialSnapshot,
    detectMilestones,
    identifyOptimalWindows,
    generateAssumptions,
    compareScenarios,
    recommendOptimalScenario,
} from './timeline.service';
import type {
    TimelineProjectionConfig,
    TimelineProjectionResult,
    TimelineSnapshot,
    IncomeGrowthScenario,
} from './timeline.types';
import { DEFAULT_INTERVAL_MONTHS, MAX_TIMELINE_YEARS } from '../../constants';

const router = express.Router();

/* ─── Validation Helpers ───────────────────────────────────────────── */

function validatePositiveNumber(value: unknown, fieldName: string): string | null {
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return `${fieldName} must be a non-negative number`;
    }
    return null;
}

function validateYear(value: unknown, fieldName: string): string | null {
    if (typeof value !== 'number' || isNaN(value) || value < 2020 || value > 2040) {
        return `${fieldName} must be a valid year between 2020 and 2040`;
    }
    return null;
}

function validateIncomeGrowthScenario(value: unknown): string | null {
    const validScenarios: IncomeGrowthScenario[] = ['conservative', 'moderate', 'aggressive'];
    if (typeof value !== 'string' || !validScenarios.includes(value as IncomeGrowthScenario)) {
        return 'incomeGrowthScenario must be one of: conservative, moderate, aggressive';
    }
    return null;
}

function validateTimelineConfig(config: any): string | null {
    // Required fields
    if (!config) {
        return 'Configuration object is required';
    }

    const startYearError = validateYear(config.startYear, 'startYear');
    if (startYearError) return startYearError;

    const endYearError = validateYear(config.endYear, 'endYear');
    if (endYearError) return endYearError;

    if (config.endYear <= config.startYear) {
        return 'endYear must be greater than startYear';
    }

    if (config.endYear - config.startYear > MAX_TIMELINE_YEARS) {
        return `Timeline cannot exceed ${MAX_TIMELINE_YEARS} years`;
    }

    const intervalError = validatePositiveNumber(config.intervalMonths, 'intervalMonths');
    if (intervalError) return intervalError;

    if (![3, 6, 12].includes(config.intervalMonths)) {
        return 'intervalMonths must be 3, 6, or 12';
    }

    const scenarioError = validateIncomeGrowthScenario(config.incomeGrowthScenario);
    if (scenarioError) return scenarioError;

    // Optional fields validation
    if (config.currentMonthlyRent !== undefined) {
        const rentError = validatePositiveNumber(config.currentMonthlyRent, 'currentMonthlyRent');
        if (rentError) return rentError;
    }

    if (config.assumedStartingSalary !== undefined) {
        const salaryError = validatePositiveNumber(config.assumedStartingSalary, 'assumedStartingSalary');
        if (salaryError) return salaryError;
    }

    if (config.assumeEmploymentDate !== undefined) {
        const date = new Date(config.assumeEmploymentDate);
        if (isNaN(date.getTime())) {
            return 'assumeEmploymentDate must be a valid ISO date string';
        }
    }

    return null;
}

/* ─── Routes ───────────────────────────────────────────────────────── */

/**
 * POST /api/timeline/project
 * Generate complete timeline projection
 */
router.post('/project', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, config } = req.body;

        // Validate sessionId
        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required and must be a string',
            });
        }

        // Validate config
        const configError = validateTimelineConfig(config);
        if (configError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid configuration',
                errors: [configError],
            });
        }

        // Fetch user session
        const session = await UserSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        // Check if profile is complete enough for projections
        if (!session.age || !session.employmentStatus || session.monthlyIncome === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Incomplete profile. Please complete onboarding first.',
                errors: ['Required fields: age, employmentStatus, monthlyIncome'],
            });
        }

        const timelineConfig: TimelineProjectionConfig = {
            startYear: config.startYear,
            endYear: config.endYear,
            intervalMonths: config.intervalMonths || DEFAULT_INTERVAL_MONTHS,
            incomeGrowthScenario: config.incomeGrowthScenario,
            assumeEmploymentDate: config.assumeEmploymentDate,
            assumedStartingSalary: config.assumedStartingSalary,
            currentMonthlyRent: config.currentMonthlyRent,
            includeOpportunityCost: config.includeOpportunityCost || false,
            cpfContributionRate: config.cpfContributionRate,
            cashSavingsRate: config.cashSavingsRate,
        };

        // Generate snapshots
        const snapshots: TimelineSnapshot[] = [];
        const startDate = new Date(timelineConfig.startYear, 0, 1);
        const endDate = new Date(timelineConfig.endYear, 11, 31);
        const now = new Date();

        let currentDate = new Date(now);
        while (currentDate <= endDate) {
            const snapshot = projectFinancialSnapshot(session, currentDate, timelineConfig);
            snapshots.push(snapshot);
            currentDate.setMonth(currentDate.getMonth() + timelineConfig.intervalMonths);
        }

        // Detect milestones
        const milestones = detectMilestones(session, snapshots, timelineConfig);

        // Identify optimal application windows
        const optimalApplicationWindows = identifyOptimalWindows(snapshots, timelineConfig);

        // Compare scenarios (now, 6m, 12m, 24m)
        const scenarioComparisons = compareScenarios(session, timelineConfig, snapshots);

        // Generate assumptions
        const assumptions = generateAssumptions(timelineConfig);

        // Build result
        const result: TimelineProjectionResult = {
            sessionId,
            config: timelineConfig,
            generatedAt: new Date().toISOString(),
            snapshots,
            milestones,
            optimalApplicationWindows,
            scenarioComparisons,
            assumptions,
        };

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/timeline/optimal-windows
 * Get optimal application windows for grant maximization (Story 2)
 */
router.get('/optimal-windows', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, scenario } = req.query;

        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'sessionId query parameter is required',
            });
        }

        // Fetch user session
        const session = await UserSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        // Use default config for quick analysis
        const incomeGrowthScenario: IncomeGrowthScenario =
            (scenario as IncomeGrowthScenario) || 'moderate';
        const config: TimelineProjectionConfig = {
            startYear: new Date().getFullYear(),
            endYear: new Date().getFullYear() + 3,
            intervalMonths: 6,
            incomeGrowthScenario,
            includeOpportunityCost: false,
        };

        // Generate snapshots
        const snapshots: TimelineSnapshot[] = [];
        const now = new Date();
        const endDate = new Date(config.endYear, 11, 31);

        let currentDate = new Date(now);
        while (currentDate <= endDate) {
            const snapshot = projectFinancialSnapshot(session, currentDate, config);
            snapshots.push(snapshot);
            currentDate.setMonth(currentDate.getMonth() + config.intervalMonths);
        }

        // Identify optimal windows
        const windows = identifyOptimalWindows(snapshots, config);

        // Get current and projected grant amounts
        const currentGrantAmount = snapshots[0]?.grants.totalGrant || 0;
        const projectedIn6Months = snapshots[1]?.grants.totalGrant || 0;
        const projectedIn12Months = snapshots[2]?.grants.totalGrant || 0;

        // Generate recommendation
        let recommendation = {
            strategy: 'apply_now',
            reason: 'Current grant amount is optimal',
            potentialGrantLoss: 0,
        };

        if (currentGrantAmount > projectedIn6Months) {
            const loss = currentGrantAmount - projectedIn6Months;
            recommendation = {
                strategy: 'apply_within_6m',
                reason: `Income will cross grant tier threshold. Apply soon to secure $${currentGrantAmount.toLocaleString()} grant.`,
                potentialGrantLoss: loss,
            };
        }

        return res.status(200).json({
            success: true,
            data: {
                windows,
                currentGrantAmount,
                projectedGrantIn6Months: projectedIn6Months,
                projectedGrantIn12Months: projectedIn12Months,
                recommendation,
            },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/timeline/compare-scenarios
 * Compare different application timing scenarios (Story 6)
 */
router.post('/compare-scenarios', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, includeOpportunityCost } = req.body;

        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required',
            });
        }

        // Fetch user session
        const session = await UserSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        // Default config for scenario comparison
        const config: TimelineProjectionConfig = {
            startYear: new Date().getFullYear(),
            endYear: new Date().getFullYear() + 3,
            intervalMonths: 6,
            incomeGrowthScenario: 'moderate',
            currentMonthlyRent: req.body.currentMonthlyRent,
            includeOpportunityCost: includeOpportunityCost || false,
        };

        // Generate snapshots
        const snapshots: TimelineSnapshot[] = [];
        const now = new Date();
        const endDate = new Date(config.endYear, 11, 31);

        let currentDate = new Date(now);
        while (currentDate <= endDate) {
            const snapshot = projectFinancialSnapshot(session, currentDate, config);
            snapshots.push(snapshot);
            currentDate.setMonth(currentDate.getMonth() + config.intervalMonths);
        }

        // Compare scenarios
        const comparisons = compareScenarios(session, config, snapshots);
        const recommendation = recommendOptimalScenario(comparisons);

        return res.status(200).json({
            success: true,
            data: {
                comparisons,
                recommendation,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
