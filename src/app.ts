import express, {Application} from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo'
import cors from 'cors'
import patientRoutes from './routes/patient'
import authRoutes from './routes/auth'
import appointmentRoutes from './routes/appointment'
import doctorRoutes from './routes/doctor'
import notificationRoutes from './routes/notification'
import dotenv from "dotenv";
import { config } from './config/config';
import helmet from 'helmet';
dotenv.config();

const app:Application = express();

app.use(cors())
app.use(express.urlencoded({extended: true }))
app.use(express.json())

// creating 24 hours from milliseconds
const oneHour = 1000 * 60 * 60;

export const SESSION_KEY: string = process.env.SESSION_KEY || 'your-secret-key';

app.use(session({
    secret: SESSION_KEY,
    name: "manage",
    saveUninitialized:true,
    resave: false,
    // store: MongoStore.create({
    //     mongoUrl: config.mongo.url,
    //     ttl: oneHour
    //   })
}));
app.use(helmet()) 

app.use((req,res, next) => {
    res.header('Access-Control-Allow-Orign', '*');
    res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization')

    if(req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
})

// app.use((req,res, next) => {
//     const error = new Error('not found');
//     console.log(error)

//     return res.status(200).json({});   
// })
//mediplan
app.get("/", (req, res) => {
    return res.status(200).send("MediPlan apis")
    });

app.use('/api', patientRoutes);
app.use('/api', authRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', doctorRoutes);
app.use('/api', notificationRoutes);

export default app