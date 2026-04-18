import express, { Request, Response, NextFunction } from 'express';
import UserSession from '../userSession/userSession.model';
import {
    projectFinancialSnapshot,
    detectMilestones,
    generateAssumptions,
    generateProjectTimeline,
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
        const salaryError = validatePositiveNumber(
            config.assumedStartingSalary,
            'assumedStartingSalary'
        );
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

/**
 * POST /api/timeline/project
 * Generate complete timeline projection
 */
router.post('/project', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, config, projects } = req.body;

        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required and must be a string',
            });
        }

        const configError = validateTimelineConfig(config);
        if (configError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid configuration',
                errors: [configError],
            });
        }

        if (projects !== undefined) {
            if (!Array.isArray(projects)) {
                return res.status(400).json({
                    success: false,
                    message: 'projects must be an array',
                });
            }
            if (projects.length > 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 3 projects allowed',
                });
            }

            for (const project of projects) {
                if (
                    !project.projectId ||
                    !project.projectName ||
                    !project.flatType ||
                    !project.price
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Each project must have projectId, projectName, flatType, and price',
                    });
                }
            }
        }

        const session = await UserSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

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

        const milestones = detectMilestones(session, snapshots, timelineConfig);

        const assumptions = generateAssumptions(timelineConfig);

        const projectTimelines: import('./timeline.types').ProjectTimeline[] = [];
        if (projects && Array.isArray(projects)) {
            for (const project of projects) {
                const projectTimeline = generateProjectTimeline(
                    session,
                    project,
                    timelineConfig,
                    snapshots
                );
                projectTimelines.push(projectTimeline);
            }
        }

        const result: TimelineProjectionResult = {
            sessionId,
            config: timelineConfig,
            generatedAt: new Date().toISOString(),
            snapshots,
            milestones,
            projectTimelines,
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

export default router;
