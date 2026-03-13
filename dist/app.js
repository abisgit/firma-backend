"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const organizations_routes_1 = __importDefault(require("./modules/organizations/organizations.routes"));
const templates_routes_1 = __importDefault(require("./modules/templates/templates.routes"));
const stamps_routes_1 = __importDefault(require("./modules/stamps/stamps.routes"));
const letters_routes_1 = __importDefault(require("./modules/letters/letters.routes"));
const hr_routes_1 = __importDefault(require("./modules/hr/hr.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const messages_routes_1 = __importDefault(require("./modules/messages/messages.routes"));
const marketing_routes_1 = __importDefault(require("./modules/marketing/marketing.routes"));
const tenants_routes_1 = __importDefault(require("./modules/tenants/tenants.routes"));
const students_routes_1 = __importDefault(require("./modules/students/students.routes"));
const teachers_routes_1 = __importDefault(require("./modules/teachers/teachers.routes"));
const classes_routes_1 = __importDefault(require("./modules/classes/classes.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const grades_routes_1 = __importDefault(require("./modules/grades/grades.routes"));
const timetable_routes_1 = __importDefault(require("./modules/timetable/timetable.routes"));
const subjects_routes_1 = __importDefault(require("./modules/subjects/subjects.routes"));
const events_routes_1 = __importDefault(require("./modules/events/events.routes"));
const parents_routes_1 = __importDefault(require("./modules/parents/parents.routes"));
const academic_routes_1 = __importDefault(require("./modules/academic/academic.routes"));
const invoices_routes_1 = __importDefault(require("./modules/invoices/invoices.routes"));
const banks_routes_1 = __importDefault(require("./modules/banks/banks.routes"));
const healthcare_routes_1 = __importDefault(require("./modules/healthcare/healthcare.routes"));
const education_payments_routes_1 = __importDefault(require("./modules/education-payments/education-payments.routes"));
const arifpay_routes_1 = __importDefault(require("./modules/tenants/arifpay.routes"));
const chapa_routes_1 = __importDefault(require("./modules/tenants/chapa.routes"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
/* ---------------- SECURITY ---------------- */
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin: ['https://dashboard.firmasafe.com', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
/* ---------------- LOGGING FIX ---------------- */
// Use /app/logs inside Docker
const logDir = path_1.default.join(process.cwd(), 'logs');
// Ensure logs directory exists
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`;
    fs_1.default.appendFile(path_1.default.join(logDir, 'request.log'), log, (err) => {
        if (err) {
            console.error('Log write failed:', err.message);
        }
    });
    next();
});
/* ---------------- STATIC ---------------- */
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public', 'uploads')));
/* ---------------- ROUTES ---------------- */
app.use('/auth', auth_routes_1.default);
app.use('/documents', documents_routes_1.default);
app.use('/organizations', organizations_routes_1.default);
app.use('/templates', templates_routes_1.default);
app.use('/stamps', stamps_routes_1.default);
app.use('/letters', letters_routes_1.default);
app.use('/users', users_routes_1.default);
app.use('/messages', messages_routes_1.default);
app.use('/marketing', marketing_routes_1.default);
app.use('/tenants', tenants_routes_1.default);
app.use('/hr', hr_routes_1.default);
app.use('/students', students_routes_1.default);
app.use('/teachers', teachers_routes_1.default);
app.use('/classes', classes_routes_1.default);
app.use('/attendance', attendance_routes_1.default);
app.use('/grades', grades_routes_1.default);
app.use('/timetable', timetable_routes_1.default);
app.use('/subjects', subjects_routes_1.default);
app.use('/events', events_routes_1.default);
app.use('/parents', parents_routes_1.default);
app.use('/academic', academic_routes_1.default);
app.use('/invoices', invoices_routes_1.default);
app.use('/banks', banks_routes_1.default);
app.use('/healthcare', healthcare_routes_1.default);
app.use('/education-payments', education_payments_routes_1.default);
app.use('/arifpay', arifpay_routes_1.default);
app.use('/chapa', chapa_routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import { env } from './config/env';
// import { errorHandler } from './middleware/error.middleware';
// import authRoutes from './modules/auth/auth.routes';
// import docRoutes from './modules/documents/documents.routes';
// import orgRoutes from './modules/organizations/organizations.routes';
// import templateRoutes from './modules/templates/templates.routes';
// import stampRoutes from './modules/stamps/stamps.routes';
// import letterRoutes from './modules/letters/letters.routes';
// import hrRoutes from './modules/hr/hr.routes';
// import userRoutes from './modules/users/users.routes';
// import messageRoutes from './modules/messages/messages.routes';
// import marketingRoutes from './modules/marketing/marketing.routes';
// import tenantRoutes from './modules/tenants/tenants.routes';
// import studentRoutes from './modules/students/students.routes';
// import teacherRoutes from './modules/teachers/teachers.routes';
// import classRoutes from './modules/classes/classes.routes';
// import attendanceRoutes from './modules/attendance/attendance.routes';
// import gradeRoutes from './modules/grades/grades.routes';
// import timetableRoutes from './modules/timetable/timetable.routes';
// import subjectRoutes from './modules/subjects/subjects.routes';
// import eventRoutes from './modules/events/events.routes';
// import parentRoutes from './modules/parents/parents.routes';
// import academicRoutes from './modules/academic/academic.routes';
// import invoiceRoutes from './modules/invoices/invoices.routes';
// import bankRoutes from './modules/banks/banks.routes';
// import healthcareRoutes from './modules/healthcare/healthcare.routes';
// import path from 'path';
// import fs from 'fs';
// // ... imports
// const app = express();
// app.use(helmet({ crossOriginResourcePolicy: false })); // Allow loading images
// // app.use(cors());
// app.use(cors({
//     origin: 'https://dashboard.firmasafe.com', // your frontend domain
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true
// }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// // ✅ FIXED: write logs to /app/logs/request.log (ensure volume is mounted)
// const logDir = path.join(process.cwd(), 'logs');
// if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
// app.use((req, res, next) => {
//     const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
//     require('fs').appendFileSync('request.log', log);
//     next();
// });
// app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
// // Main Routes
// app.use('/auth', authRoutes);
// app.use('/documents', docRoutes);
// app.use('/organizations', orgRoutes);
// app.use('/templates', templateRoutes);
// app.use('/stamps', stampRoutes);
// app.use('/letters', letterRoutes);
// app.use('/users', userRoutes);
// app.use('/messages', messageRoutes);
// app.use('/marketing', marketingRoutes);
// app.use('/tenants', tenantRoutes);
// app.use('/hr', hrRoutes);
// app.use('/students', studentRoutes);
// app.use('/teachers', teacherRoutes);
// app.use('/classes', classRoutes);
// app.use('/attendance', attendanceRoutes);
// app.use('/grades', gradeRoutes);
// app.use('/timetable', timetableRoutes);
// app.use('/subjects', subjectRoutes);
// app.use('/events', eventRoutes);
// app.use('/parents', parentRoutes);
// app.use('/academic', academicRoutes);
// app.use('/invoices', invoiceRoutes);
// app.use('/banks', bankRoutes);
// app.use('/healthcare', healthcareRoutes);
// app.use(errorHandler);
// export default app;
