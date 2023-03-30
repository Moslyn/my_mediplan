import { NextFunction, Request, Response } from "express";
import Appointment, { appointmentStatus } from "../models/appointment";
import Patient from "../models/patient";
import Doctor, { IDoctorModel } from "../models/doctor";
import { allTime, generateOtp } from "../util/constants";
import otpMaster, { OtpType } from "../models/otpMaster";
import mailService from "../util/mailService";
import verifyEmailTemplate from "../templates/verifyEmail";
import { createNotification } from "./Notification";
import { notificationStatus } from "../models/notification";

const checkAvailabilityForAllDoctors = async (startTime: Date) => {
  const doctors = await Doctor.find({});
  const availableDoctors = [];
  for (const doctor of doctors) {
    const bookedDates = doctor.bookedDateTime;
    let isAvailable = true;
    for (const bookedDate of bookedDates) {
      const bookedStartTime = new Date(bookedDate).getTime();
      const selectedStartTime = new Date(startTime).getTime();
      if (bookedStartTime === selectedStartTime) {
        isAvailable = false;
        break;
      }
    }
    if (isAvailable) {
      availableDoctors.push(doctor.email);
    }
  }
  return availableDoctors;
};

const checkFirstAppointment = async (email: string) => {
  const appointments = await Appointment.find({
    patientMail: email,
  })

  return appointments
}

const getAvailableTimes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const desiredDate = req.params.date;
    const doctors = await Doctor.find({});
    const bookedDateTimes: String[] = doctors.reduce(
      (acc: String[], doctor: IDoctorModel) => {
        return acc.concat(doctor.bookedDateTime);
      },
      []
    );
    console.log(`booked time: ${bookedDateTimes}`);

    const matchingDateTimes = bookedDateTimes.filter((dateTime: String) => {
      const date = dateTime.substr(0, 10);
      return date === desiredDate;
    });

    console.log(`matchingDateTimes: ${matchingDateTimes}`);

    const unAvailable: String[] = [];

    for (let i = 0; i < matchingDateTimes.length; i++) {
      const count = matchingDateTimes.filter(
        (num) => num === matchingDateTimes[i]
      ).length;
      if (
        count === doctors.length &&
        !unAvailable.includes(matchingDateTimes[i])
      ) {
        unAvailable.push(matchingDateTimes[i]);
      }
    }

    console.log(`unAvailable: ${unAvailable}`);

    const unAvailableTimes: string[] = unAvailable.map((dateTime) => {
      const timeString = dateTime.substring(11, 16);
      return timeString;
    });

    console.log(`unique booked times: ${unAvailableTimes}`);

    const availableTimeSlots: string[] = allTime.filter((timeSlot: string) => {
      return !unAvailableTimes.includes(timeSlot);
    });

    if (availableTimeSlots.length) {
      return res.status(200).json(availableTimeSlots);
    } else {
      return res.status(404).json("No available time");
    }
  } catch (error) {
    return res.status(500).json(error);
  }
};

const sendOTP = async (email: string, type: string, otp: string) => {
  try {
    let newOtp = new otpMaster({
      email,
      type: type,
      otp,
    });
    await newOtp.save();

    //SEND VERIFICATION MAIL TO USER
    const emailTemplate = verifyEmailTemplate(otp);
    await mailService.transporter.sendMail({
      from: `"MediPlan " ${process.env.SMTP_SENDER}`,
      to: email,
      subject: "Verify OTP",
      // html: emailTemplate.html,
      html: emailTemplate.html,
    });
  } catch (error) {
    console.log(error);
  }
};

const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(`request body: ${req.body}`);
    let { patientMail, reason, date, startTime } = req.body;

    const patient = await Patient.findOne({ email: patientMail });
    console.log(`patient: ${patient}`);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if the selected time is available for any doctor
    const availableDoctors = await checkAvailabilityForAllDoctors(startTime);
    console.log(`available doctors: ${availableDoctors}`);

    // If there are no available doctors, return an error response
    if (availableDoctors.length === 0) {
      return res
        .status(400)
        .json({ message: "No doctor is available at the selected time" });
    }

    // Randomly select an available doctor from the list
    const selectedDoctor =
      availableDoctors[Math.floor(Math.random() * availableDoctors.length)];
    console.log(`selected doctor: ${selectedDoctor}`);

    const code: string = generateOtp(5);

    // Create a new appointment object with the selected doctor
    const appointment = new Appointment({
      reason,
      code,
      patientMail,
      date,
      startTime,
      doctorMail: selectedDoctor,
    });

    const endTime = appointment.endTime;
    // Save the new appointment to the database
    await appointment.save();

    await sendOTP(patientMail, OtpType.APPOINTMENT, code);

    const doctor = await Doctor.findOne({ email: selectedDoctor });
    if (doctor) {
      doctor.bookedDateTime.push(startTime);
      doctor.save();
      
      const appointments = await checkFirstAppointment(patientMail)
      if (appointments.length == 0) {
        const message: string = `Congrats! You just booked your first appointment!`;
        createNotification(patientMail, message, notificationStatus.CREATED);
      } else {
        const message: string = `You just booked an appointment for ${date}, ${startTime}`;
        createNotification(patientMail, message, notificationStatus.CREATED);
      }
      

    } else {
      res.status(500).json("error");
    }

    // Return a success response
    return res.status(200).json({
      message: "Appointment created successfully",
      appointment: appointment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("error");
  }
};

const getAppointmentsByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    //const email = req.session.email;
    const appointments = await Appointment.find({
      patientMail: email
    }).sort({ startTime: 1 });
    if (!appointments) {
      return res.status(400).json({ message: "No appointments" });
    }

    return res.status(200).json(appointments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

const getAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointmentId = req.params.appointmentId;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(400).json({ message: "Patient Not Found!" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

const getAllAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointments = await Appointment.find();

    return res.status(200).json(appointments);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointmentId = req.params.appointmentId;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(400).json({ message: "Appointment Not Found!" });
    }

    const doctor = await Doctor.findOne({ email: appointment.doctorMail });
    if (doctor) {
      const bookedDateTime: string[] = doctor.bookedDateTime;
      console.log(`start time : ${appointment.startTime}`);
      console.log(`booked time : ${bookedDateTime}`);

      const filteredArr = bookedDateTime.filter(
        (value) => value !== appointment.startTime
      );
      console.log(`filteredArr: ${filteredArr}`);

      doctor.bookedDateTime = filteredArr;
      await doctor.save();

      appointment.appointmentStatus = appointmentStatus.CANCELLED;
      await appointment.save();

      const message: string = `You appointment for ${appointment.date} has been cancelled`;
      createNotification(appointment.patientMail, message, notificationStatus.CANCELLED);
    } else {
      res.status(500).json("error");
    }

    return res.status(201).json({ message: "deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

export default {
  getAvailableTimes,
  createAppointment,
  getAppointmentsByEmail,
  getAppointment,
  getAllAppointments,
  cancelAppointment,
};
