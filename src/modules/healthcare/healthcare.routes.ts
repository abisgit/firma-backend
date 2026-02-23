import { Router } from 'express';
import { HealthcareController } from './healthcare.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Patients
router.get('/patients', HealthcareController.getPatients);
router.get('/patients/:id', HealthcareController.getPatient);
router.post('/patients', HealthcareController.createPatient);
router.put('/patients/:id', HealthcareController.updatePatient);
router.delete('/patients/:id', HealthcareController.deletePatient);

// Medical Records
router.post('/medical-records', HealthcareController.createMedicalRecord);

// Doctors
router.get('/doctors', HealthcareController.getDoctors);
router.get('/doctors/:id', HealthcareController.getDoctor);
router.post('/doctors', HealthcareController.createDoctor);
router.put('/doctors/:id', HealthcareController.updateDoctor);
router.delete('/doctors/:id', HealthcareController.deleteDoctor);

// Departments
router.get('/departments', HealthcareController.getDepartments);
router.post('/departments', HealthcareController.createDepartment);
router.put('/departments/:id', HealthcareController.updateDepartment);
router.delete('/departments/:id', HealthcareController.deleteDepartment);

// Qualifications
router.get('/qualifications', HealthcareController.getQualifications);
router.post('/qualifications', HealthcareController.createQualification);
router.delete('/qualifications/:id', HealthcareController.deleteQualification);

// Specializations
router.get('/specializations', HealthcareController.getSpecializations);
router.post('/specializations', HealthcareController.createSpecialization);
router.delete('/specializations/:id', HealthcareController.deleteSpecialization);

// Appointments
router.get('/appointments', HealthcareController.getAppointments);
router.post('/appointments', HealthcareController.createAppointment);
router.put('/appointments/:id', HealthcareController.updateAppointment);
router.delete('/appointments/:id', HealthcareController.deleteAppointment);

// Doctor Documents
router.get('/doctor-documents', HealthcareController.getDoctorDocuments);
router.post('/doctor-documents', HealthcareController.createDoctorDocument);
router.delete('/doctor-documents/:id', HealthcareController.deleteDoctorDocument);

// Other
router.get('/medicines', HealthcareController.getMedicines);
router.get('/lab-tests', HealthcareController.getLabTests);
router.post('/lab-tests', HealthcareController.createLabTest);
router.put('/lab-tests/:id', HealthcareController.updateLabTest);
router.delete('/lab-tests/:id', HealthcareController.deleteLabTest);
router.get('/transactions', HealthcareController.getTransactions);
router.post('/transactions', HealthcareController.createTransaction);
router.get('/summary', HealthcareController.getSummaryStats);

// Prescriptions
router.get('/prescriptions', HealthcareController.getPrescriptions);
router.get('/prescriptions/:id', HealthcareController.getPrescription);
router.post('/prescriptions', HealthcareController.createPrescription);

export default router;
