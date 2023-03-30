import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment {  
  reason: string;
  code: string;
  patientMail: string;
  date: Date;
  startTime: string;
  endTime: Date;
  doctorMail: string;
  appointmentStatus?: string;
}

export interface IAppointmentModel extends IAppointment, Document {
  calculateEndTime: () => Date;
}

export enum appointmentStatus {
  PENDING = 'pending',
  ATTENDED = 'attended',
  MISSED = 'missed',
  CANCELLED = "cancelled"
}

const AppointmentSchema: Schema = new Schema(
  {
    reason: { type: String, required: true },
    code: { type: String},
    patientMail: {type: String},
    date: {type: Date, required: true},
    startTime: { type: String, required: true },
    endTime: { type: Date},
    doctorMail: {type: String},
    appointmentStatus: {type: String, enum: Object.values(appointmentStatus), default: appointmentStatus.PENDING,}
  },
  {
    versionKey: false,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);


AppointmentSchema.pre<IAppointment>('save', function(this: IAppointment, next) {
  if (!this.endTime) {
    const startTime = this.startTime;
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 15);
    this.endTime = endTime;
  }
  next();
});


export default mongoose.model<IAppointmentModel>(
  "Appointment",
  AppointmentSchema
);
