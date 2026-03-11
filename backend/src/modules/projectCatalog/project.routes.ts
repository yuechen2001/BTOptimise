/**
 * Project Routes
 * Defines the API endpoints for retrieving project information, including filtering by estate, classification, and flat type.
 * 
 * Endpoints:
 * - GET /api/projects: Retrieve a list of projects with optional filters (estate, classification, flatType).
 * - GET /api/projects/:projectCode: Retrieve detailed information about a specific project by its project code.
 * 
 * The routes use the Project model to query the MongoDB database and return the results in JSON format.
 */
import express, { Request, Response, NextFunction } from "express";
import Project from "./project.model";

const router = express.Router();

/**
 * GET /api/projects
 * Retrieves a list of projects with optional filters for estate, classification, and flat type.
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
            data: projects
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/projects/:projectCode
 * Retrieves detailed information about a specific project by its project code.
 */
router.get("/:projectCode", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await Project.findOne({ projectCode: req.params.projectCode }).lean();

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        res.json({ success: true, data: project });
    } catch (err) {
        next(err);
    }
});

export default router;