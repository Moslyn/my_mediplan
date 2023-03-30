import express from 'express';
import appointmentController from '../controllers/Appointment'
const router = express.Router();

router.get('/appointmentTimes/:date', appointmentController.getAvailableTimes);
router.post('/appointments', appointmentController.createAppointment);
router.post('/appointmentsByEmail', appointmentController.getAppointmentsByEmail);
router.get('/appointments/:appointmentId', appointmentController.getAppointment);
router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments/:appointmentId', appointmentController.cancelAppointment);

export = router;