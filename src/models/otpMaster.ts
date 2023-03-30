import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp {
    userId: any;
    type: string;
    otp: string;
    otpExpiration: Date | null;
}

//EXPORT INTERFACE WITH MONGOOSE DOCUMENT
export interface IOtpModel extends IOtp, Document {}

export enum OtpType {
    LOGIN = 'login',
    FORGOT = 'forgot',
    VERIFICATION = 'verification',
    APPOINTMENT = 'appointment',
    Profile = 'profile',
}

//DEFINE OTP SCHEMA
const OtpSchema: Schema = new Schema(
    {
        email: { 
            type: String, 
            required: true,
            match: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/},

        type: {
            type: String,
            enum: Object.values(OtpType),
        },
        otp: {
            type: String,
            required: true,
        },
        otpExpiration: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

//EXPORT
export default mongoose.model<IOtpModel>('Otp', OtpSchema);