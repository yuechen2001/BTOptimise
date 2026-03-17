/**
 * Application Rate Routes
 *
 * Endpoints:
 * - GET /api/application-rates: Retrieve a list of application rates with optional filters (launchCode, estate, flatType, projectCode).
 * - GET /api/application-rates/:launchCode/:flatType: Retrieve a specific application rate by launch code and flat type.
 *
 * The routes use the ApplicationRate model to query the MongoDB database and return the results in JSON format.
 */
import express, { Request, Response, NextFunction } from 'express';
import ApplicationRate from './applicationRate.model';

const router = express.Router();

// GET /api/application-rates
// Optional query parameters: launchCode, estate, flatType, projectCode
// Example: /api/application-rates?estate=Estate%20A&flatType=3%20Room
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { launchCode, estate, flatType, projectCode } = req.query;

        const query: Record<string, unknown> = {};

        if (launchCode) {
            query.launchCode = launchCode;
        }

        if (estate) {
            query.estate = estate;
        }

        if (flatType) {
            query.flatType = flatType;
        }

        if (projectCode) {
            query.projectCodes = projectCode;
        }

        const rows = await ApplicationRate.find(query)
            .sort({ estate: 1, projectGroup: 1, flatType: 1 })
            .lean();

        res.json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/application-rates/:launchCode/:flatType
 * Retrieves a specific application rate by launch code and flat type.
 * Example: /api/application-rates/LC123/3%20Room
 */
router.get('/:launchCode/:flatType', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const row = await ApplicationRate.findOne({
            launchCode: req.params.launchCode,
            flatType: req.params.flatType,
        }).lean();

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Application rate row not found',
            });
        }

        return res.json({
            success: true,
            data: row,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
