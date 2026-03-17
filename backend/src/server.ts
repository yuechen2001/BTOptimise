/**
 * - Loads environment variables using dotenv.
 * - Connects to MongoDB using Mongoose.
 * - Starts the Express server on the specified port.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI;

async function startServer(): Promise<void> {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        await mongoose.connect(MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 30000,
        });
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

void startServer();
