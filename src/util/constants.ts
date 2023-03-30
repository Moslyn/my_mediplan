import jwt, { Secret } from "jsonwebtoken";
import { Request, Response, NextFunction } from 'express';
import otpMaster from "../models/otpMaster";
import dotenv from "dotenv";

dotenv.config();
export const SECRET_KEY: Secret = process.env.JWT_SECRET_KEY || 'your-secret-key';

//GENERATE OTP
export const generateOtp = function (len: number): string {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < len; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};
//VERIFY GENERATED OTP
export const verifyOtp = async function (email: any, otp: string, type: string): Promise<any> {
    let existOtp = await otpMaster.findOne({
        email,
        otp,
        type,
    });
    const currentDate = new Date();
    if (!existOtp || existOtp.otpExpiration! < currentDate) {
        return null;
    }
    return existOtp._id;
};
//GENERATE OTP
export const generateToken = function (payload: object = {}): string {
    const token =  jwt.sign(payload, SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
        });
    return token;
};
//Exctract Email
export const extractEmail = function (req: Request): any {
    const token = req.header('Authorization')?.replace('Bearer ', '');
   if (!token) {
     throw new Error();
   }
   const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
};

export const extractToken = async function (req: Request): Promise<any> {
    const token = req.header('Authorization')?.replace('Bearer ', '');

   if (!token) {
     throw new Error();
   }

    return token;
};

export const allTime = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                                    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                                    "15:00", "15:30", "16:00", "16:30",]