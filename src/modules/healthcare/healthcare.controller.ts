import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';

export class HealthcareController {
    // Patients
    static async getPatients(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const patients = await prisma.patient.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            });
            res.json(patients);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch patients' });
        }
    }

    static async getPatient(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const patient = await prisma.patient.findFirst({
                where: { id, organizationId },
                include: {
                    medicalRecords: {
                        include: { doctor: true },
                        orderBy: { visitDate: 'desc' }
                    },
                    appointments: {
                        include: { doctor: true },
                        orderBy: { appointmentDate: 'desc' }
                    },
                    transactions: {
                        orderBy: { transactionDate: 'desc' }
                    }
                }
            });

            if (!patient) return res.status(404).json({ error: 'Patient not found' });
            res.json(patient);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch patient details' });
        }
    }

    static async createPatient(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const patient = await prisma.patient.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(patient);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create patient' });
        }
    }

    static async updatePatient(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const patient = await prisma.patient.updateMany({
                where: { id, organizationId },
                data: req.body
            });

            if (patient.count === 0) return res.status(404).json({ error: 'Patient not found' });
            res.json({ message: 'Patient updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update patient' });
        }
    }

    static async deletePatient(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const patient = await prisma.patient.deleteMany({
                where: { id, organizationId }
            });

            if (patient.count === 0) return res.status(404).json({ error: 'Patient not found' });
            res.json({ message: 'Patient deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete patient' });
        }
    }

    // Doctors
    static async getDoctors(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const doctors = await prisma.doctor.findMany({
                where: { organizationId },
                orderBy: { fullName: 'asc' }
            });
            res.json(doctors);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch doctors' });
        }
    }

    // Appointments
    static async getAppointments(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const appointments = await prisma.appointment.findMany({
                where: { organizationId },
                include: {
                    patient: true,
                    doctor: true
                },
                orderBy: { appointmentDate: 'desc' }
            });
            res.json(appointments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    }

    // Pharmacy
    static async getMedicines(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const medicines = await prisma.medicine.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(medicines);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch inventory' });
        }
    }

    // Laboratory
    static async getLabTests(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const tests = await prisma.labTest.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            });
            res.json(tests);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch lab tests' });
        }
    }

    // Billing
    static async getTransactions(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const transactions = await prisma.healthcareTransaction.findMany({
                where: { organizationId },
                orderBy: { transactionDate: 'desc' }
            });
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }

    // Summary Stats
    static async getSummaryStats(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [
                patientCount,
                appointmentCount,
                revenue,
                inpatientCount,
                recentCriticals
            ] = await Promise.all([
                prisma.patient.count({ where: { organizationId } }),
                prisma.appointment.count({
                    where: {
                        organizationId,
                        appointmentDate: { gte: today, lt: tomorrow }
                    }
                }),
                prisma.healthcareTransaction.aggregate({
                    where: { organizationId },
                    _sum: { amount: true }
                }),
                prisma.patient.count({
                    where: {
                        organizationId,
                        status: 'Inpatient'
                    }
                }),
                prisma.patient.findMany({
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
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch summary stats' });
        }
    }
}
