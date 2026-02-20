"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareController = void 0;
const db_1 = __importDefault(require("../../config/db"));
class HealthcareController {
    // Patients
    static async getPatients(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const patients = await db_1.default.patient.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            });
            res.json(patients);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch patients' });
        }
    }
    // Doctors
    static async getDoctors(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const doctors = await db_1.default.doctor.findMany({
                where: { organizationId },
                orderBy: { fullName: 'asc' }
            });
            res.json(doctors);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch doctors' });
        }
    }
    // Appointments
    static async getAppointments(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const appointments = await db_1.default.appointment.findMany({
                where: { organizationId },
                include: {
                    patient: true,
                    doctor: true
                },
                orderBy: { appointmentDate: 'desc' }
            });
            res.json(appointments);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    }
    // Pharmacy
    static async getMedicines(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const medicines = await db_1.default.medicine.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(medicines);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch inventory' });
        }
    }
    // Laboratory
    static async getLabTests(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const tests = await db_1.default.labTest.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            });
            res.json(tests);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch lab tests' });
        }
    }
    // Billing
    static async getTransactions(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const transactions = await db_1.default.healthcareTransaction.findMany({
                where: { organizationId },
                orderBy: { transactionDate: 'desc' }
            });
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }
    // Summary Stats
    static async getSummaryStats(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const [patientCount, appointmentCount, revenue, inpatientCount, recentCriticals] = await Promise.all([
                db_1.default.patient.count({ where: { organizationId } }),
                db_1.default.appointment.count({
                    where: {
                        organizationId,
                        appointmentDate: { gte: today, lt: tomorrow }
                    }
                }),
                db_1.default.healthcareTransaction.aggregate({
                    where: { organizationId },
                    _sum: { amount: true }
                }),
                db_1.default.patient.count({
                    where: {
                        organizationId,
                        status: 'Inpatient'
                    }
                }),
                db_1.default.patient.findMany({
                    where: {
                        organizationId,
                        status: { in: ['Critical', 'In Surgery', 'Inpatient'] }
                    },
                    take: 5,
                    orderBy: { updatedAt: 'desc' }
                })
            ]);
            // Assuming a fixed capacity of 200 for bed occupancy percentage
            const bedOccupancy = Math.min(Math.round((inpatientCount / 200) * 100), 100);
            res.json({
                totalPatients: patientCount,
                todayAppointments: appointmentCount,
                totalRevenue: revenue._sum.amount || 0,
                bedOccupancy,
                inpatientCount,
                recentCriticals: recentCriticals.map(p => ({
                    id: p.patientId,
                    name: p.fullName,
                    condition: p.department, // Using department as condition for now
                    status: p.status,
                    time: 'Just now' // Simplified for now
                }))
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch summary stats' });
        }
    }
}
exports.HealthcareController = HealthcareController;
