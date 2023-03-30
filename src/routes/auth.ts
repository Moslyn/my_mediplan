import express from 'express';
import patientController from '../controllers/Patient'
import authcontroller from '../controllers/Auth'
const router = express.Router();

router.post('/auth/signup', patientController.createPatient);
router.post('/auth/signin', authcontroller.signIn);
router.post('/auth/verifylogin', authcontroller.verifyLogin);
router.post('/auth/verifyforgotpassword', authcontroller.verifyForgotPassword);
router.post('/auth/resetpassword', authcontroller.resetPassword);
router.post('/auth/logout', authcontroller.logOut);

export = router;