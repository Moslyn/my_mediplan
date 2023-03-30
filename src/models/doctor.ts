import mongoose, { Document, Schema } from "mongoose";

export interface IDoctor {
    fullName: string;
    email: string;
    phoneNumber: string;
    homeAddress: string;
    postalCode: string;
    bookedDateTime: string[];
}

export interface IDoctorModel extends IDoctor, Document {}

const DoctorSchema = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, match: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/},
        bookedDateTime: { type: Array, required: true },
        phoneNumber: { type: String, required: true },
        homeAddress: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    {
        versionKey: false,
        timestamps: true
    })

    export default mongoose.model<IDoctorModel>('Doctor', DoctorSchema)