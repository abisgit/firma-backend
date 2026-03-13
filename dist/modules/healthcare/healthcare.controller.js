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
                where: { organizationId: organizationId },
                orderBy: { createdAt: 'desc' }
            });
            res.json(patients);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch patients' });
        }
    }
    static async getPatient(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            const cleanId = (id || '').trim();
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            // Detect if identifier is a UUID to target the correct database field
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
            let patient = null;
            // Step 1: Securely fetch the core patient record
            if (isUuid) {
                patient = await db_1.default.patient.findFirst({
                    where: { id: cleanId, organizationId }
                });
            }
            else {
                patient = await db_1.default.patient.findFirst({
                    where: { patientId: cleanId, organizationId }
                });
            }
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found in this organization' });
            }
            // Step 2: Fetch related medical data with safety wrappers to prevent 500s on data orphans
            const medicalRecords = await db_1.default.medicalRecord.findMany({
                where: { patientId: patient.id },
                include: { doctor: true },
                orderBy: { visitDate: 'desc' }
            }).catch(err => {
                console.error('[HMS] Relation Error (medicalRecords):', err.message);
                return [];
            });
            const appointments = await db_1.default.appointment.findMany({
                where: { patientId: patient.id },
                include: { doctor: true },
                orderBy: { startDatetime: 'desc' }
            }).catch(err => {
                console.error('[HMS] Relation Error (appointments):', err.message);
                return [];
            });
            const transactions = await db_1.default.healthcareTransaction.findMany({
                where: { patientId: patient.id },
                orderBy: { transactionDate: 'desc' }
            }).catch(err => {
                console.error('[HMS] Relation Error (transactions):', err.message);
                return [];
            });
            const prescriptions = await db_1.default.prescription.findMany({
                where: { patientId: patient.id },
                include: {
                    doctor: true,
                    items: { include: { medicine: true } }
                },
                orderBy: { createdAt: 'desc' }
            }).catch(err => {
                console.error('[HMS] Relation Error (prescriptions):', err.message);
                return [];
            });
            // Step 3: Return consolidated patient data
            return res.json({
                ...patient,
                medicalRecords,
                appointments,
                transactions,
                prescriptions
            });
        }
        catch (error) {
            console.error('[HMS] CRITICAL Failure in getPatient:', error);
            return res.status(500).json({
                error: 'An unexpected error occurred while fetching patient data',
                message: error.message
            });
        }
    }
    static async createPatient(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const patient = await db_1.default.patient.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(patient);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create patient' });
        }
    }
    static async updatePatient(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const patient = await db_1.default.patient.updateMany({
                where: {
                    id: id,
                    organizationId: organizationId
                },
                data: req.body
            });
            if (patient.count === 0)
                return res.status(404).json({ error: 'Patient not found' });
            res.json({ message: 'Patient updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update patient' });
        }
    }
    static async deletePatient(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const patient = await db_1.default.patient.deleteMany({
                where: {
                    id: id,
                    organizationId: organizationId
                },
            });
            if (patient.count === 0)
                return res.status(404).json({ error: 'Patient not found' });
            res.json({ message: 'Patient deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete patient' });
        }
    }
    // Medical Records
    static async createMedicalRecord(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const record = await db_1.default.medicalRecord.create({
                data: {
                    ...req.body,
                    organizationId: organizationId
                },
                include: { doctor: true }
            });
            res.status(201).json(record);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create medical record' });
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
                include: {
                    department: true,
                    qualification: true,
                    specialization: true,
                    documents: true
                },
                orderBy: { fullName: 'asc' }
            });
            res.json(doctors);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch doctors' });
        }
    }
    static async getDoctor(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const doctor = await db_1.default.doctor.findFirst({
                where: { id: id, organizationId: organizationId },
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
            if (!doctor)
                return res.status(404).json({ error: 'Doctor not found' });
            res.json(doctor);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch doctor details' });
        }
    }
    static async createDoctor(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const doctor = await db_1.default.doctor.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(doctor);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create doctor' });
        }
    }
    static async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.doctor.updateMany({
                where: { id: id, organizationId: organizationId },
                data: req.body
            });
            res.json({ message: 'Doctor updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update doctor' });
        }
    }
    static async deleteDoctor(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.doctor.deleteMany({
                where: { id: id, organizationId: organizationId }
            });
            res.json({ message: 'Doctor deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete doctor' });
        }
    }
    // Departments
    static async getDepartments(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const departments = await db_1.default.department.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(departments);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch departments' });
        }
    }
    static async createDepartment(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const department = await db_1.default.department.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(department);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create department' });
        }
    }
    static async updateDepartment(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.department.updateMany({
                where: { id: id, organizationId: organizationId },
                data: req.body
            });
            res.json({ message: 'Department updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update department' });
        }
    }
    static async deleteDepartment(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.department.deleteMany({
                where: { id: id, organizationId: organizationId }
            });
            res.json({ message: 'Department deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete department' });
        }
    }
    // Qualifications
    static async getQualifications(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const data = await db_1.default.doctorQualification.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch' });
        }
    }
    static async createQualification(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const item = await db_1.default.doctorQualification.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(item);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create' });
        }
    }
    static async deleteQualification(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.doctorQualification.deleteMany({
                where: { id: id, organizationId: organizationId }
            });
            res.json({ message: 'Deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
        }
    }
    // Specializations
    static async getSpecializations(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const data = await db_1.default.doctorSpecialization.findMany({
                where: { organizationId },
                orderBy: { name: 'asc' }
            });
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch' });
        }
    }
    static async createSpecialization(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const item = await db_1.default.doctorSpecialization.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(item);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create' });
        }
    }
    static async deleteSpecialization(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.doctorSpecialization.deleteMany({
                where: { id: id, organizationId: organizationId }
            });
            res.json({ message: 'Deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
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
                orderBy: { startDatetime: 'desc' }
            });
            res.json(appointments);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    }
    static async createAppointment(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const appointment = await db_1.default.appointment.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(appointment);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to book' });
        }
    }
    static async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.appointment.updateMany({
                where: { id: id, organizationId: organizationId },
                data: req.body
            });
            res.json({ message: 'Updated' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    static async deleteAppointment(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.appointment.deleteMany({
                where: { id: id, organizationId: organizationId }
            });
            res.json({ message: 'Deleted' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    // Doctor Documents
    static async getDoctorDocuments(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const docs = await db_1.default.doctorDocument.findMany({
                where: { organizationId },
                include: { doctor: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json(docs);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    static async createDoctorDocument(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const doc = await db_1.default.doctorDocument.create({
                data: { ...req.body, organizationId }
            });
            res.status(201).json(doc);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    static async deleteDoctorDocument(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.doctorDocument.deleteMany({
                where: { id: id, organizationId: organizationId }
            });
            res.json({ message: 'Deleted' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
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
    static async createMedicine(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const { name, category, strength, form, commonUse, details, stock, price, expiryDate } = req.body;
            const medicine = await db_1.default.medicine.create({
                data: {
                    name,
                    category,
                    strength,
                    form,
                    commonUse,
                    details,
                    stock: parseInt(stock),
                    price: price ? parseFloat(price) : 0.0,
                    expiryDate: new Date(expiryDate),
                    organizationId
                }
            });
            res.status(201).json(medicine);
        }
        catch (error) {
            console.error('[HMS] Create Medicine Error:', error);
            res.status(500).json({ error: 'Failed to create medicine' });
        }
    }
    static async updateMedicine(req, res) {
        try {
            const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const { name, category, strength, form, commonUse, details, stock, price, expiryDate, status } = req.body;
            const medicine = await db_1.default.medicine.update({
                where: { id, organizationId },
                data: {
                    name,
                    category,
                    strength,
                    form,
                    commonUse,
                    details,
                    stock: stock !== undefined ? parseInt(stock) : undefined,
                    price: price !== undefined ? parseFloat(price) : undefined,
                    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                    status
                }
            });
            res.json(medicine);
        }
        catch (error) {
            console.error('[HMS] Update Medicine Error:', error);
            res.status(500).json({ error: 'Failed to update medicine' });
        }
    }
    static async deleteMedicine(req, res) {
        try {
            const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            await db_1.default.medicine.delete({
                where: { id, organizationId }
            });
            res.status(204).send();
        }
        catch (error) {
            console.error('[HMS] Delete Medicine Error:', error);
            res.status(500).json({ error: 'Failed to delete medicine' });
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
    static async createLabTest(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const test = await db_1.default.labTest.create({
                data: {
                    ...req.body,
                    organizationId
                }
            });
            res.status(201).json(test);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create lab test' });
        }
    }
    static async updateLabTest(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const test = await db_1.default.labTest.updateMany({
                where: {
                    id: id,
                    organizationId: organizationId
                },
                data: req.body
            });
            if (test.count === 0)
                return res.status(404).json({ error: 'Lab test not found' });
            res.json({ message: 'Lab test updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update lab test' });
        }
    }
    static async deleteLabTest(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const test = await db_1.default.labTest.deleteMany({
                where: {
                    id: id,
                    organizationId: organizationId
                },
            });
            if (test.count === 0)
                return res.status(404).json({ error: 'Lab test not found' });
            res.json({ message: 'Lab test deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete lab test' });
        }
    }
    // Billing
    static async getTransactions(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const transactions = await db_1.default.healthcareTransaction.findMany({
                where: { organizationId: organizationId },
                include: { patient: true },
                orderBy: { transactionDate: 'desc' }
            });
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }
    static async createTransaction(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const transaction = await db_1.default.healthcareTransaction.create({
                data: {
                    ...req.body,
                    organizationId: organizationId
                },
                include: { patient: true }
            });
            res.status(201).json(transaction);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create transaction' });
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
                        startDatetime: { gte: today, lt: tomorrow }
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
    // Prescriptions
    static async getPrescriptions(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const { status, search } = req.query;
            const where = { organizationId: organizationId };
            if (status && status !== 'All Status') {
                where.status = status;
            }
            if (search) {
                const searchVal = search.toLowerCase();
                where.OR = [
                    { prescriptionId: { contains: searchVal, mode: 'insensitive' } },
                    { patient: { fullName: { contains: searchVal, mode: 'insensitive' } } },
                    { patient: { patientId: { contains: searchVal, mode: 'insensitive' } } },
                    { doctor: { fullName: { contains: searchVal, mode: 'insensitive' } } },
                    { doctor: { doctorCode: { contains: searchVal, mode: 'insensitive' } } },
                ];
            }
            const prescriptions = await db_1.default.prescription.findMany({
                where,
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
        }
        catch (error) {
            console.error('[HMS] getPrescriptions Error:', error);
            res.status(500).json({ error: 'Failed to fetch prescriptions' });
        }
    }
    static async getPrescription(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const prescription = await db_1.default.prescription.findFirst({
                where: {
                    id: id,
                    organizationId: organizationId
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
            if (!prescription)
                return res.status(404).json({ error: 'Prescription not found' });
            res.json(prescription);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch prescription details' });
        }
    }
    static async createPrescription(req, res) {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const { items, ...rest } = req.body;
            const prescription = await db_1.default.prescription.create({
                data: {
                    ...rest,
                    organizationId: organizationId,
                    items: {
                        create: items
                    }
                }
            });
            res.status(201).json(prescription);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create prescription' });
        }
    }
    static async dispensePrescription(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            if (!organizationId)
                return res.status(403).json({ error: 'Organization identifier missing' });
            const prescription = await db_1.default.prescription.findFirst({
                where: { id: id, organizationId: organizationId, status: 'Pending' },
                include: { items: true }
            });
            if (!prescription) {
                return res.status(404).json({ error: 'Pending prescription not found' });
            }
            await db_1.default.$transaction(async (tx) => {
                for (const item of prescription.items) {
                    await tx.medicine.update({
                        where: { id: item.medicineId },
                        data: { stock: { decrement: 1 } }
                    });
                }
                await tx.prescription.update({
                    where: { id: prescription.id },
                    data: { status: 'Dispensed' }
                });
            });
            res.json({ message: 'Prescription dispensed and stock updated' });
        }
        catch (error) {
            console.error('[HMS] Dispense Error:', error);
            res.status(500).json({ error: 'Failed to dispense prescription', details: error.message });
        }
    }
}
exports.HealthcareController = HealthcareController;
