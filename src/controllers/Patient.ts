import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import Patient from "../models/patient";
import { generateOtp, verifyOtp } from "../util/constants";
import otpMaster, { OtpType } from "../models/otpMaster";
import verifyEmailTemplate from "../templates/verifyEmail";
import mailService from "../util/mailService";
import resetPassword from "../templates/resetPassword";
import loginTemp from "../templates/login";

const createPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let {fullName,email,password,confirmPassword,phoneNumber,homeAddress,postalCode,otp,createdDate,updatedDate} = req.body;

        var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        if(!strongRegex.test(password)){
            return res.status(400).json({message: 'Password must have Uppercase, Lowercase, Number and a special character'});
        }

        // var ukPhoneRegex = new RegExp("^((\+44)|(0)) ?\d{4} ?\d{6}$");
        // if(!ukPhoneRegex.test(phoneNumber)){
        //     return res.status(400).json({message: 'Not a uk number '});
        // }

        if(password !== confirmPassword){
            return res.status(400).json({message: 'Password Do Not Match!'});
        }
        const hashedPassword = await bcrypt.hash(password, 8)
        
        const patient = new Patient({
            _id: new mongoose.Types.ObjectId(),
            fullName,
            email,
            password : hashedPassword,
            phoneNumber,
            homeAddress,
            postalCode,
            otp,
            isEmailVerified: true,
            createdDate,
            updatedDate
        })
        
        await patient.save()

        return res.status(200).json(patient)
    } catch (error) {
        console.log(error)
        return res.status(500).json('error');
    }
}

const getPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = req.params.patientId;

        const patient = await Patient.findById(patientId)
        if(!patient){
            return res.status(400).json({message: 'Patient Not Found!'});
        }

        return res.status(200).json(patient)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patients = await Patient.find()

        // const patientIdd = req.session;
        // console.log(patientIdd)
        
        // if(patientIdd.patientId){
        //     console.log('I dey here ',req.session.patientId)
        // }
        // else{
        //     console.log('dey play')
        // }

        // const email = await req.session.email;
        // console.log(`email : ${email}`)
        return res.status(200).json(patients)
    } catch (error) {
        console.log(error)
        return res.status(500).send({error});
    }
}

const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = req.params.patientId;
        const patient = await Patient.findById(patientId)

        if(!patient){
            return res.status(400).json({message: 'Patient Not Found!'});
        }
        patient?.set(req.body)
        patient?.save()

        return res.status(200).json(patient)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = req.params.patientId;

        const patient = await Patient.findByIdAndDelete(patientId)
        if(!patient){
            return res.status(400).json({message: 'Patient Not Found!'});
        }

        return res.status(201).json({message: 'deleted'})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email,type } = req.body;

        if (type === 'verificiation'){
            const userExist = await Patient.exists({ email });
            if (userExist) {
                return res.status(400).json({message: 'Email already verified!'});
            }    
        }

         //GENERATE OTP FOR MAIL VERIFICATION
         let tokenExpiration: any = new Date();
         tokenExpiration = tokenExpiration.setMinutes(
             tokenExpiration.getMinutes() + 5
         );
 
         const otp: string = generateOtp(5);
 
         let newOtp = new otpMaster({
             email,
             type: type,
             otp,
             otpExpiration: new Date(tokenExpiration),
         });
         await newOtp.save();
 
         //SEND VERIFICATION MAIL TO USER
        const emailTemplate = verifyEmailTemplate(otp);
        const loginTemplate = loginTemp(otp);
        const paswordTemplate = resetPassword(otp,email);
        await mailService.transporter.sendMail({
            from: `"MediPlan " ${process.env.SMTP_SENDER}`,
            to: email,
                subject: 'Verify OTP',
                // html: emailTemplate.html,
                html: newOtp.type === 'verification' ? emailTemplate.html : 
                    newOtp.type === 'login' ? loginTemplate.html : paswordTemplate.html,
            })

        return res.status(200).json(otp)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email,otp} = req.body;
        
        const patient = await Patient.findOne({email})
        if(patient){
            return res.status(400).json({message: 'Patient Email Is Already Verified.'});
        }

        //VERIFYING OTP
        let isOtpValid = await verifyOtp(email, otp, OtpType.VERIFICATION);
        if(!isOtpValid){
            return res.status(400).json({message: 'Invalid OTP!'});
        }

        //DEELTE OTP
        await otpMaster.findByIdAndDelete(isOtpValid);
        
        return res.status(200).json({message: 'Email Verification Successfull.'});

    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patientId = req.params.patientId;
        
        const patient = await Patient.findById(patientId)
        if(!patient){
            return res.status(400).json({message: 'Patient Not Found'});
        }
        let {currentPassword, newPassword, confirmPassword} = req.body;

        const patientPassword:string = patient?.password!

        const isMatch = bcrypt.compareSync(currentPassword, patientPassword);
        if (!isMatch) {
            return res.status(400).json({message: 'Wrong Password!'});
        }

        var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        if(!strongRegex.test(newPassword)){
            return res.status(400).json({message: 'Password must have Uppercase, Lowercase, Number and a special character'});
        }

        if(newPassword !== confirmPassword){
            return res.status(400).json({message: 'Password Do Not Match!'});
        }
        newPassword = await bcrypt.hash(newPassword, 8)

        patient?.set(patient.password = newPassword)
        patient?.save()

        return res.status(200).json(patient)
    } catch (error) {
        console.log(error)
        return res.status(500).send({error});
    }
}

export default {createPatient, getPatient, getAllPatients, updatePatient, deletePatient, sendOTP, verifyEmail, changePassword}