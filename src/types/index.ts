import { SessionData } from "express-session"

declare module 'express-session' {
    export interface SessionData {
      patientId: { [key: string]: any };
      email: string;
    }
  }