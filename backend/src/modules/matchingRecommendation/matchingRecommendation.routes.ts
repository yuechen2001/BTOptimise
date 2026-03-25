import express, { Request, Response, NextFunction } from 'express';
import UserSession from '../userSession/userSession.model';
import Project from '../projectCatalog/project.model';
import { calculateFinancials } from '../financialRules/financialRules.service';
import ApplicationRate from '../applicationRates/applicationRate.model';
import {
    checkIsAffordable,
    getDemandColour,
    isFlatTypePreferred,
} from './matchingRecommendations.utils';

const router = express.Router();

/**
 * GET /api/matching-recommendation/:sessionId
 */
router.get('/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;

        const session = await UserSession.findOne({ sessionId }).lean();
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        const query: any = {};
        if (session.preferredRegions?.length) {
            query.estate = { $in: session.preferredRegions };
        }

        const projects = await Project.find(query).lean();
        const projectCodes = projects.map((p) => p.projectCode);
        const appRates = await ApplicationRate.find({
            projectCodes: {
                $in: projectCodes,
            },
        }).lean();

        const recommendations = projects
            .flatMap((project) => {
                return project.flatTypes
                    .filter((flat) => isFlatTypePreferred(session, flat))
                    .map((flat) => {
                        const financials = calculateFinancials(
                            session as any,
                            flat.minIndicativePrice || 0,
                            flat.type
                        );

                        const rateData = appRates.find((r) => {
                            return (
                                r.projectCodes.includes(project.projectCode) &&
                                r.flatType === flat.type
                            );
                        });
                        const rate = rateData?.overallAppRate || 0;

                        return {
                            ...project,
                            selectedFlat: {
                                ...flat,
                                financials,
                                isAffordable: checkIsAffordable(session, flat),
                                demandInfo: {
                                    rate: rate,
                                    colour: getDemandColour(rate),
                                    totalUnits: rateData?.noOfUnits,
                                    totalApplicants: rateData?.noOfApplicants,
                                },
                            },
                        };
                    });
            })
            .filter((rec) => rec.selectedFlat.financials.eligibility.canPurchaseBTO);

        // sort by application rate then price
        recommendations.sort((a, b) => {
            if (a.selectedFlat.demandInfo.rate !== b.selectedFlat.demandInfo.rate) {
                return a.selectedFlat.demandInfo.rate - b.selectedFlat.demandInfo.rate;
            }

            return (
                (a.selectedFlat.minIndicativePrice || 0) - (b.selectedFlat.minIndicativePrice || 0)
            );
        });

        return res.status(200).json({
            success: true,
            recommendations: recommendations,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
