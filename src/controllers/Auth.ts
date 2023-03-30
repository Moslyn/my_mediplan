import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcrypt';
import Patient from "../models/patient";
import patientCreate from '../controllers/Patient'
import { extractToken, generateToken, SECRET_KEY, verifyOtp } from "../util/constants";
import dotenv from "dotenv";
import otpMaster, { OtpType } from "../models/otpMaster";
dotenv.config();
const signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patient =  patientCreate.createPatient!
        return res.status(200).json(patient)
    } catch (error) {
        console.log(error)
        return res.status(500).json('error');
    }
}
const signIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email, password} = req.body;
        const patient = await Patient.findOne({email: email})
        if(!patient){
            return res.status(400).json({message: 'Patient Not Found'});
        }
        const patientPassword:string = patient?.password!
        const isMatch = bcrypt.compareSync(password, patientPassword);
        if (!isMatch) {
            return res.status(400).json({message: 'Password Do Not Match!'});
        }
        // const token = generateToken({id:patient.id, email:patient.email, name: patient.fullName});
        const token = generateToken({patient:patient});

        var sessionId = req.session.patientId
        var sessionEmail = req.session.email
        if(token){
            sessionId = patient.id
            sessionEmail = patient.email
        }
        req.session.save(err => {
            if(err){
                console.log(err);
            } else {
                console.log('session saved')
            }
        }); //THIS SAVES THE SESSION.

        return res.status(200).json({token})

    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}
const verifyLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email,otp} = req.body;
        const patient = await Patient.findOne({email})
        if(!patient){
            return res.status(400).json({message: 'Patient Email Not Verified.'});
        }
        //VERIFYING OTP
        let isOtpValid = await verifyOtp(email, otp, OtpType.LOGIN);
        if(!isOtpValid){
            return res.status(400).json({message: 'Invalid OTP'});
        }
        //DEELTE OTP
        await otpMaster.findByIdAndDelete(isOtpValid);
        return res.status(200).json({message: 'Login Successful.'});
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}
const verifyForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email,otp} = req.body;
        const patient = await Patient.findOne({email})
        if(!patient){
            return res.status(400).json({message: 'Patient Email Not Verified.'});
        }
        //VERIFYING OTP
        let isOtpValid = await verifyOtp(email, otp, OtpType.FORGOT);
        if(!isOtpValid){
            return res.status(400).json({message: 'Invalid OTP'});
        }
        //DEELTE OTP
        await otpMaster.findByIdAndDelete(isOtpValid);
        return res.status(200).json({message: 'ForgotPassword Verification Successful.'});
    } catch (error) {
        console.log(error)
        return res.status(500).send({error});
    }
}
const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let {email, newPassword, confirmPassword} = req.body;
        const userExist = await Patient.exists({ email });
        if (!userExist) {
            return res.status(400).json({message: 'Email Not Found'});
        }
        const patient = await Patient.findById(userExist)
        if(newPassword !== confirmPassword){
            return  res.status(400).json({message: 'Password Do Not Match!'});
        }
        newPassword = await bcrypt.hash(newPassword, 8)
        patient?.set(patient.password = newPassword)
        patient?.save()
        return res.status(200).json({patient, message: 'Password Reset Successful'})
    } catch (error) {
        console.log(error)
        return res.status(500).send({error});
    }
}
const logOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = await extractToken(req)
        if(!token){
            return  res.status(400).json({message: 'Cannot extract token!'});
        }
        req.session.destroy
        return res.status(200).json({message:'Successfuly logged out'})
    } catch (error) {
        console.log(error)
        return res.status(500).json('error');

    }   
}
export default {signUp, signIn, verifyLogin, verifyForgotPassword, resetPassword, logOut }