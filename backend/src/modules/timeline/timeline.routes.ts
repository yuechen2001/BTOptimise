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
} from './timeline.types';
import { DEFAULT_INTERVAL_MONTHS } from '../../constants';
import { validateTimelineConfig } from './timeline.utils';

const router = express.Router();

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
