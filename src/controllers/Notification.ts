import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Notification, { notificationStatus } from "../models/notification";
import Patient from "../models/patient";
import Appointment, { appointmentStatus } from "../models/appointment";

export const createNotification = async (
  patientMail: string,
  message: string,
  notificationStatus: string
) => {
  try {
    const notification = new Notification({
      _id: new mongoose.Types.ObjectId(),
      patientMail,
      message,
      notificationStatus,
    });
    await notification.save();
  } catch (error) {
    console.log(error);
  }
};

const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await Notification.find();

    return res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

const getNotificationsByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    //const email = req.session.email;
    const notifications = await Notification.find({
      patientMail: email
    }).sort({ createdAt: -1 });
    if (!notifications) {
      return res.status(400).json({ message: "No notifications" });
    }

    return res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

export const createNotificationEveryMorning = async (): Promise<void> => {
  try {
    const patients = await Patient.find({});
    if (patients) {
      for (const patient of patients) {
        const appointments = await Appointment.find({
          patientMail: patient.email,
        });

        const startTimes = appointments
          .map((appointment) => appointment.startTime)
          .filter((startTime) => {
            const currentDate = new Date().toISOString().substr(0, 10);
            const date = startTime.substr(0, 10)
            return date === currentDate
          });

        console.log(`Start times for patient ${patient.fullName}:`, startTimes);
        for (const startTime of startTimes) {
          // Parse the start time as a Date object
          const date = new Date(startTime);

          // Extract the time portion of the Date object
          const hours = date.getHours();
          const minutes = date.getMinutes();

          // Convert the hours to 12-hour format
          let hours12 = hours % 12;
          if (hours12 === 0) {
            hours12 = 12;
          }

          // Determine if it's AM or PM
          const amOrPm = hours < 12 ? "AM" : "PM";

          // Construct the formatted time string
          const timeString = `${hours12}:${minutes
            .toString()
            .padStart(2, "0")}${amOrPm}`;

          console.log(timeString);

          const message: string = `Your appointment for today is by ${timeString}. Don't miss it`;
          createNotification(
            patient.email,
            message,
            notificationStatus.REGULAR
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const createNotificationForMissedAppointments = async (): Promise<void> => {
  try {
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16);
    console.log(currentDateTime);

    const patients = await Patient.find({});
    if (patients) {
      for (const patient of patients) {
        console.log(`patient: ${patient}`);
        const appointments = await Appointment.find({
          patientMail: patient.email,
          appointmentStatus: "pending",
        });
        console.log(`appointments: ${appointments}`);
        if (appointments.length > 0) {
          const startTimes = appointments.map(
            (appointment) => appointment.startTime
          );
          console.log(
            `Start times for patient ${patient.fullName}:`,
            startTimes
          );
          for (const startTime of startTimes) {
            if (currentDateTime > startTime) {
              const appointment = await Appointment.findOne({
                patientMail: patient.email,
                startTime: startTime,
              });
              console.log("herre");
              console.log(`appointment: ${appointment}`);
              if (appointment) {
                appointment.appointmentStatus = appointmentStatus.MISSED;
                await appointment.save()
                const message: string = `Hi, ${patient.fullName}! You missed your appointment :(`;
                createNotification(
                  patient.email,
                  message,
                  notificationStatus.MISSED
                );
              }
            }
          }

          // for (const appointment of appointments) {
          //     console.log(`appointment: ${appointment}`)
          //     if( currentDateTime > appointment.startTime ){
          //         console.log("here")
          //         if(appointment.appointmentStatus == appointmentStatus.PENDING){
          //             appointment.appointmentStatus = appointmentStatus.MISSED
          //             const message: string = `Hi, ${patient.fullName}! You missed your appointment :(`;
          //             createNotification(patient.email, message, notificationStatus.MISSED);
          //         }
          //     }
          // }
        } else {
          console.log("no appointment");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export default { getAllNotifications, getNotificationsByEmail, };
