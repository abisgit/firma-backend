import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import docRoutes from './modules/documents/documents.routes';
import orgRoutes from './modules/organizations/organizations.routes';
import templateRoutes from './modules/templates/templates.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/auth', authRoutes);
app.use('/documents', docRoutes);
app.use('/organizations', orgRoutes);
app.use('/templates', templateRoutes);

app.use(errorHandler);

export default app;
