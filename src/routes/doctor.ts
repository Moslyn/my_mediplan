import express from 'express';
import doctorController from '../controllers/Doctor'
import { auth } from '../middleware/auth';
const router = express.Router();

router.post('/doctors', doctorController.createDoctor);
router.get('/doctors/:doctorId', doctorController.getDoctor);
router.get('/doctors', doctorController.getAllDoctors);
router.patch('/doctors/:doctorId', doctorController.updateDoctor);
router.delete('/doctors/:doctorId', doctorController.deleteDoctor);

export = router;