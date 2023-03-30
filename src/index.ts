import mongoose from 'mongoose';
import app from './app'
import dotenv from "dotenv";
import { config } from './config/config';
//import cron from "node-cron"
import {createNotificationEveryMorning, createNotificationForMissedAppointments} from './controllers/Notification'

dotenv.config();


const start = async (): Promise<void> => {
    try {
    mongoose.connect(config.mongo.url, {retryWrites: true, w: 'majority'})
    console.log('connected to mongoDb')
    
    app.listen(config.server.port, () => {
        console.log(`Server started on port ${config.server.port}`);
      });
    
      // cron.schedule('0 8 * * 1-5', async () => {
      //   try {
      //     await createNotificationEveryMorning();
      //   } catch (error) {
      //     console.error(error);
      //   }
      // });

      //running every hour
      // cron.schedule('0 * * * *', async () => {
      //   try {
      //     await createNotificationForMissedAppointments();
      //   } catch (error) {
      //     console.error(error);
      //   }
      // });

    } catch (error) {
        console.log('Unable to connect')
      process.exit(1);
    }
  };

  
void start();
