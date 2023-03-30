import mongoose, { Document, Schema } from "mongoose";

export interface IPatient {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    homeAddress: string;
    postalCode: string;
    isEmailVerified: Boolean;
}

enum userRole {
    admin='admin',
    user='user'
}

export interface IPatientModel extends IPatient, Document {}

const PatientSchema = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, match: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/},
        password: { type: String },
        phoneNumber: { type: String, required: true },
        homeAddress: { type: String, required: true },
        postalCode: { type: String, required: true },
        isEmailVerified: {type: Boolean, default: false},
        userType: { type: String, enum: userRole, default: userRole.user }
    },
    {
        versionKey: false,
        timestamps: true
    })

    export default mongoose.model<IPatientModel>('Patient', PatientSchema)