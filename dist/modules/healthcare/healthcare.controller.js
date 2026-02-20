"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class HealthcareController {
    // Patients
    static async getPatients(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const patients = await prisma.patient.findMany({
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
            const doctors = await prisma.doctor.findMany({
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
            const appointments = await prisma.appointment.findMany({
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
            const medicines = await prisma.medicine.findMany({
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
            const tests = await prisma.labTest.findMany({
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
            const transactions = await prisma.healthcareTransaction.findMany({
                where: { organizationId },
                orderBy: { transactionDate: 'desc' }
            });
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }
}
exports.HealthcareController = HealthcareController;
