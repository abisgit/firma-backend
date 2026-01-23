import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import docRoutes from './modules/documents/documents.routes';
import orgRoutes from './modules/organizations/organizations.routes';
import templateRoutes from './modules/templates/templates.routes';

import stampRoutes from './modules/stamps/stamps.routes';
import letterRoutes from './modules/letters/letters.routes';
import userRoutes from './modules/users/users.routes';
import path from 'path';

// ... imports

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false })); // Allow loading images
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Main Routes
app.use('/auth', authRoutes);
app.use('/documents', docRoutes);
app.use('/organizations', orgRoutes);
app.use('/templates', templateRoutes);
app.use('/stamps', stampRoutes);
app.use('/letters', letterRoutes);
app.use('/users', userRoutes);

app.use(errorHandler);

export default app;
