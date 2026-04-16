import express, { Request, Response, NextFunction } from 'express';
import Project from './project.model';

const router = express.Router();

/**
 * GET /api/projects
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { estate, classification, flatType } = req.query;

        const query: Record<string, unknown> = {};

        if (estate) {
            query.estate = estate;
        }

        if (classification) {
            query.classification = classification;
        }

        if (flatType) {
            query['flatTypes.type'] = flatType;
        }

        const projects = await Project.find(query).sort({ name: 1 }).lean();

        res.json({
            success: true,
            count: projects.length,
            data: projects,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/projects/:projectCode
 */
router.get('/:projectCode', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await Project.findOne({ projectCode: req.params.projectCode }).lean();

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({ success: true, data: project });
    } catch (err) {
        next(err);
    }
});

export default router;
