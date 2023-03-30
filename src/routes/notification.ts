import express from 'express';
import notificationController from '../controllers/Notification'
const router = express.Router();

//router.post('/notifications', notificationController.createNotification);
router.get('/notifications', notificationController.getAllNotifications);
router.post('/notificationsByEmail', notificationController.getNotificationsByEmail);
// router.get('/notificationMissed', notificationController.createNotificationForMissedAppointments);
// router.get('/notificationEveryMorning', notificationController.createNotificationEveryMorning);

export = router;