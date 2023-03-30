import express from 'express';
import patientController from '../controllers/Patient'
import { auth } from '../middleware/auth';
const router = express.Router();

router.post('/patients', patientController.createPatient);
router.get('/patients/:patientId', auth, patientController.getPatient);
router.get('/patients', auth, patientController.getAllPatients);
router.patch('/patients/:patientId', auth, patientController.updatePatient);
router.delete('/patients/:patientId', auth, patientController.deletePatient);
router.post('/patients/sendotp', patientController.sendOTP);
router.post('/patients/verifyemailotp', patientController.verifyEmail);
router.post('/patients/changepassword/:patientId', auth, patientController.changePassword);

export = router;