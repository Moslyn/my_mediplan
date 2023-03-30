import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Doctor from "../models/doctor";
import { extractEmail } from "../util/constants";

const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let {fullName,email,phoneNumber,homeAddress,postalCode, bookedDateTime} = req.body;
        
        const userExist = await Doctor.exists({ email });
        if (userExist) {
            return res.status(400).json({message: 'Email address is already used!'});
        }

        const doctor = new Doctor({
            _id: new mongoose.Types.ObjectId(),
            fullName,
            email,
            phoneNumber,
            homeAddress,
            postalCode,
            bookedDateTime,
        })
        
        await doctor.save()

        return res.status(200).json(doctor)
    } catch (error) {
        console.log(error)
        return res.status(500).json('error');

    }
    
}

const getDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = req.params.doctorId;
        const doctor = await Doctor.findById(doctorId)
        if(!doctor){
            return res.status(400).json({message: 'Doctor Not Found!'});
        }

        return res.status(200).json(doctor)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctors = await Doctor.find()

        return res.status(200).json(doctors)
    } catch (error) {
        console.log(error)
        return res.status(500).send({error});
    }
}

const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = req.params.doctorId;
        const doctor = await Doctor.findById(doctorId)

        if(!doctor){
            return res.status(400).json({message: 'Doctor Not Found!'});
        }
        doctor?.set(req.body)
        doctor?.save()

        return res.status(200).json(doctor)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}

const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = req.params.doctorId;

        const doctor = await Doctor.findByIdAndDelete(doctorId)
        if(!doctor){
            return res.status(400).json({message: 'Doctor Not Found!'});
        }

        return res.status(201).json({message: 'deleted'})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error});
    }
}



export default {createDoctor, getDoctor, getAllDoctors, updateDoctor, deleteDoctor}