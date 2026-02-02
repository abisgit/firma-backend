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
import hrRoutes from './modules/hr/hr.routes';
import userRoutes from './modules/users/users.routes';
import messageRoutes from './modules/messages/messages.routes';
import marketingRoutes from './modules/marketing/marketing.routes';
import tenantRoutes from './modules/tenants/tenants.routes';
import studentRoutes from './modules/students/students.routes';
import teacherRoutes from './modules/teachers/teachers.routes';
import classRoutes from './modules/classes/classes.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import gradeRoutes from './modules/grades/grades.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import subjectRoutes from './modules/subjects/subjects.routes';
import eventRoutes from './modules/events/events.routes';
import parentRoutes from './modules/parents/parents.routes';
import path from 'path';

// ... imports

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false })); // Allow loading images
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    require('fs').appendFileSync('request.log', log);
    next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Main Routes
app.use('/auth', authRoutes);
app.use('/documents', docRoutes);
app.use('/organizations', orgRoutes);
app.use('/templates', templateRoutes);
app.use('/stamps', stampRoutes);
app.use('/letters', letterRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);
app.use('/marketing', marketingRoutes);
app.use('/tenants', tenantRoutes);
app.use('/hr', hrRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/classes', classRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/grades', gradeRoutes);
app.use('/timetable', timetableRoutes);
app.use('/subjects', subjectRoutes);
app.use('/events', eventRoutes);
app.use('/parents', parentRoutes);

app.use(errorHandler);

export default app;
