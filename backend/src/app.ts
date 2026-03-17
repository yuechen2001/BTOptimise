/**
 * Main application setup.
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import projectRoutes from './modules/projectCatalog/project.routes';
import applicationRateRoutes from './modules/applicationRates/applicationRate.routes';
import userSessionRoutes from './modules/userSession/userSession.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('BTOptimise API is running');
});

app.use('/api/projects', projectRoutes);
app.use('/api/application-rates', applicationRateRoutes);
app.use('/api/sessions', userSessionRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

export default app;
