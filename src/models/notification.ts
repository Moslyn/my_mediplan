import mongoose, { Document, Schema } from "mongoose";

export interface INotification {
    message: string;
    patientMail: string;
    notificationStatus?: string;
}

export interface INotificationModel extends INotification, Document {
}

export enum notificationStatus {
  REGULAR = 'regular',
  CREATED ='created',
  ATTENDED = 'attended',
  CANCELLED = 'cancelled',
  MISSED = 'missed'
}

const NotificationSchema: Schema = new Schema(
  {
    message: {type: String, required: true},
    patientMail: {type: String, required: true},
    notificationStatus: {type: String, enum: Object.values(notificationStatus), default: notificationStatus.REGULAR,}
  },
  {
    versionKey: false,
    timestamps: true,
  }
);


export default mongoose.model<INotificationModel>(
  "Notification",
  NotificationSchema
);
