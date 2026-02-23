"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthcare_controller_1 = require("./healthcare.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Patients
router.get('/patients', healthcare_controller_1.HealthcareController.getPatients);
router.get('/patients/:id', healthcare_controller_1.HealthcareController.getPatient);
router.post('/patients', healthcare_controller_1.HealthcareController.createPatient);
router.put('/patients/:id', healthcare_controller_1.HealthcareController.updatePatient);
router.delete('/patients/:id', healthcare_controller_1.HealthcareController.deletePatient);
// Medical Records
router.post('/medical-records', healthcare_controller_1.HealthcareController.createMedicalRecord);
// Doctors
router.get('/doctors', healthcare_controller_1.HealthcareController.getDoctors);
router.get('/doctors/:id', healthcare_controller_1.HealthcareController.getDoctor);
router.post('/doctors', healthcare_controller_1.HealthcareController.createDoctor);
router.put('/doctors/:id', healthcare_controller_1.HealthcareController.updateDoctor);
router.delete('/doctors/:id', healthcare_controller_1.HealthcareController.deleteDoctor);
// Departments
router.get('/departments', healthcare_controller_1.HealthcareController.getDepartments);
router.post('/departments', healthcare_controller_1.HealthcareController.createDepartment);
router.put('/departments/:id', healthcare_controller_1.HealthcareController.updateDepartment);
router.delete('/departments/:id', healthcare_controller_1.HealthcareController.deleteDepartment);
// Qualifications
router.get('/qualifications', healthcare_controller_1.HealthcareController.getQualifications);
router.post('/qualifications', healthcare_controller_1.HealthcareController.createQualification);
router.delete('/qualifications/:id', healthcare_controller_1.HealthcareController.deleteQualification);
// Specializations
router.get('/specializations', healthcare_controller_1.HealthcareController.getSpecializations);
router.post('/specializations', healthcare_controller_1.HealthcareController.createSpecialization);
router.delete('/specializations/:id', healthcare_controller_1.HealthcareController.deleteSpecialization);
// Appointments
router.get('/appointments', healthcare_controller_1.HealthcareController.getAppointments);
router.post('/appointments', healthcare_controller_1.HealthcareController.createAppointment);
router.put('/appointments/:id', healthcare_controller_1.HealthcareController.updateAppointment);
router.delete('/appointments/:id', healthcare_controller_1.HealthcareController.deleteAppointment);
// Doctor Documents
router.get('/doctor-documents', healthcare_controller_1.HealthcareController.getDoctorDocuments);
router.post('/doctor-documents', healthcare_controller_1.HealthcareController.createDoctorDocument);
router.delete('/doctor-documents/:id', healthcare_controller_1.HealthcareController.deleteDoctorDocument);
// Other
router.get('/medicines', healthcare_controller_1.HealthcareController.getMedicines);
router.get('/lab-tests', healthcare_controller_1.HealthcareController.getLabTests);
router.post('/lab-tests', healthcare_controller_1.HealthcareController.createLabTest);
router.put('/lab-tests/:id', healthcare_controller_1.HealthcareController.updateLabTest);
router.delete('/lab-tests/:id', healthcare_controller_1.HealthcareController.deleteLabTest);
router.get('/transactions', healthcare_controller_1.HealthcareController.getTransactions);
router.post('/transactions', healthcare_controller_1.HealthcareController.createTransaction);
router.get('/summary', healthcare_controller_1.HealthcareController.getSummaryStats);
// Prescriptions
router.get('/prescriptions', healthcare_controller_1.HealthcareController.getPrescriptions);
router.get('/prescriptions/:id', healthcare_controller_1.HealthcareController.getPrescription);
router.post('/prescriptions', healthcare_controller_1.HealthcareController.createPrescription);
exports.default = router;
