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
                where: { organizationId: organizationId as string },
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
            const cleanId = (id as string || '').trim();

            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const patient = await prisma.patient.findFirst({
                where: {
                    AND: [
                        { organizationId: organizationId as string },
                        {
                            OR: [
                                { id: cleanId },
                                { patientId: cleanId }
                            ]
                        }
                    ]
                },
                include: {
                    medicalRecords: {
                        include: { doctor: true },
                        orderBy: { visitDate: 'desc' }
                    },
                    appointments: {
                        include: { doctor: true },
                        orderBy: { startDatetime: 'desc' }
                    },
                    transactions: {
                        orderBy: { transactionDate: 'desc' }
                    },
                    prescriptions: {
                        include: {
                            doctor: true,
                            items: {
                                include: { medicine: true }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!patient) {
                // FALLBACK: Try without includes to see if it's a relation issue
                const barePatient = await prisma.patient.findFirst({
                    where: {
                        AND: [
                            { organizationId: organizationId as string },
                            {
                                OR: [
                                    { id: cleanId },
                                    { patientId: cleanId }
                                ]
                            }
                        ]
                    }
                });

                if (barePatient) {
                    return res.status(500).json({
                        error: 'Patient exists but details failed to load',
                        details: 'A medical record or relation might be corrupted or missing for this patient.'
                    });
                }

                return res.status(404).json({
                    error: `Patient ID "${cleanId}" not found in organization "${organizationId}".`
                });
            }

            res.json(patient);
        } catch (error: any) {
            console.error('[HMS] Error fetching patient details:', error);
            res.status(500).json({
                error: 'Failed to fetch patient details',
                message: error.message,
                code: error.code
            });
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
                where: {
                    id: id as string,
                    organizationId: organizationId as string
                },
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
                where: {
                    id: id as string,
                    organizationId: organizationId as string
                },
            });

            if (patient.count === 0) return res.status(404).json({ error: 'Patient not found' });
            res.json({ message: 'Patient deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete patient' });
        }
    }

    // Medical Records
    static async createMedicalRecord(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const record = await prisma.medicalRecord.create({
                data: {
                    ...req.body,
                    organizationId: organizationId as string
                },
                include: { doctor: true }
            });
            res.status(201).json(record);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create medical record' });
        }
    }

    // Doctors
    static async getDoctors(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const doctors = await prisma.doctor.findMany({
                where: { organizationId },
                include: {
                    department: true,
                    qualification: true,
                    specialization: true,
                    documents: true
                },
                orderBy: { fullName: 'asc' }
            });
            res.json(doctors);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch doctors' });
        }
    }

    static async getDoctor(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const doctor = await prisma.doctor.findFirst({
                where: { id: id as string, organizationId: organizationId as string },
                include: {
                    department: true,
                    qualification: true,
                    specialization: true,
                    documents: true,
                    appointments: {
                        include: { patient: true },
                        orderBy: { startDatetime: 'desc' }
                    }
                }
            });

            if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
            res.json(doctor);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch doctor details' });
        }
    }

    static async createDoctor(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const doctor = await prisma.doctor.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(doctor);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create doctor' });
        }
    }

    static async updateDoctor(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.doctor.updateMany({
                where: { id: id as string, organizationId: organizationId as string },
                data: req.body
            });
            res.json({ message: 'Doctor updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update doctor' });
        }
    }

    static async deleteDoctor(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.doctor.deleteMany({
                where: { id: id as string, organizationId: organizationId as string }
            });
            res.json({ message: 'Doctor deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete doctor' });
        }
    }

    // Departments
    static async getDepartments(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const departments = await prisma.department.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(departments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch departments' });
        }
    }

    static async createDepartment(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const department = await prisma.department.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(department);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create department' });
        }
    }

    static async updateDepartment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.department.updateMany({
                where: { id: id as string, organizationId: organizationId as string },
                data: req.body
            });
            res.json({ message: 'Department updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update department' });
        }
    }

    static async deleteDepartment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.department.deleteMany({
                where: { id: id as string, organizationId: organizationId as string }
            });
            res.json({ message: 'Department deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete department' });
        }
    }

    // Qualifications
    static async getQualifications(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const data = await prisma.doctorQualification.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch' });
        }
    }

    static async createQualification(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const item = await prisma.doctorQualification.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(item);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create' });
        }
    }

    static async deleteQualification(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.doctorQualification.deleteMany({
                where: { id: id as string, organizationId: organizationId as string }
            });
            res.json({ message: 'Deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
        }
    }

    // Specializations
    static async getSpecializations(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const data = await prisma.doctorSpecialization.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch' });
        }
    }

    static async createSpecialization(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const item = await prisma.doctorSpecialization.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(item);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create' });
        }
    }

    static async deleteSpecialization(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.doctorSpecialization.deleteMany({
                where: { id: id as string, organizationId: organizationId as string }
            });
            res.json({ message: 'Deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
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
                orderBy: { startDatetime: 'desc' }
            });
            res.json(appointments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    }

    static async createAppointment(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const appointment = await prisma.appointment.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(appointment);
        } catch (error) {
            res.status(500).json({ error: 'Failed to book' });
        }
    }

    static async updateAppointment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.appointment.updateMany({
                where: { id: id as string, organizationId: organizationId as string },
                data: req.body
            });
            res.json({ message: 'Updated' });
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }

    static async deleteAppointment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.appointment.deleteMany({
                where: { id: id as string, organizationId: organizationId as string }
            });
            res.json({ message: 'Deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }

    // Doctor Documents
    static async getDoctorDocuments(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const docs = await prisma.doctorDocument.findMany({
                where: { organizationId },
                include: { doctor: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json(docs);
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }

    static async createDoctorDocument(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const doc = await prisma.doctorDocument.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(doc);
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }

    static async deleteDoctorDocument(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            await prisma.doctorDocument.deleteMany({
                where: { id: id as string, organizationId: organizationId as string }
            });
            res.json({ message: 'Deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
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

    static async createLabTest(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const test = await prisma.labTest.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(test);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create lab test' });
        }
    }

    static async updateLabTest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const test = await prisma.labTest.updateMany({
                where: {
                    id: id as string,
                    organizationId: organizationId as string
                },
                data: req.body
            });

            if (test.count === 0) return res.status(404).json({ error: 'Lab test not found' });
            res.json({ message: 'Lab test updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update lab test' });
        }
    }

    static async deleteLabTest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const test = await prisma.labTest.deleteMany({
                where: {
                    id: id as string,
                    organizationId: organizationId as string
                },
            });

            if (test.count === 0) return res.status(404).json({ error: 'Lab test not found' });
            res.json({ message: 'Lab test deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete lab test' });
        }
    }

    // Billing
    static async getTransactions(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const transactions = await prisma.healthcareTransaction.findMany({
                where: { organizationId: organizationId as string },
                include: { patient: true },
                orderBy: { transactionDate: 'desc' }
            });
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }

    static async createTransaction(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const transaction = await prisma.healthcareTransaction.create({
                data: {
                    ...req.body,
                    organizationId: organizationId as string
                },
                include: { patient: true }
            });
            res.status(201).json(transaction);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create transaction' });
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
                        startDatetime: { gte: today, lt: tomorrow }
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

    // Prescriptions
    static async getPrescriptions(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const prescriptions = await prisma.prescription.findMany({
                where: { organizationId: organizationId as string },
                include: {
                    patient: true,
                    doctor: true,
                    items: {
                        include: { medicine: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(prescriptions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch prescriptions' });
        }
    }

    static async getPrescription(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const prescription = await prisma.prescription.findFirst({
                where: {
                    id: id as string,
                    organizationId: organizationId as string
                },
                include: {
                    patient: true,
                    doctor: true,
                    items: {
                        include: { medicine: true }
                    },
                    appointment: true
                }
            });

            if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
            res.json(prescription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch prescription details' });
        }
    }

    static async createPrescription(req: AuthRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) return res.status(403).json({ error: 'Organization identifier missing' });

            const { items, ...rest } = req.body;

            const prescription = await prisma.prescription.create({
                data: {
                    ...rest,
                    organizationId: organizationId as string,
                    items: {
                        create: items
                    }
                }
            });
            res.status(201).json(prescription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create prescription' });
        }
    }
}
