import { ObjectId } from "mongodb";

export type Owner = {
  _id?: ObjectId;
  name: string;
};

export type Clinic = {
  _id?: ObjectId;
  name: string;
  address: string;
  ownerId: ObjectId;
};

export type Voicebot = {
  _id?: ObjectId;
  name: string;
  clinicId: ObjectId;
};

export type Appointment = {
  _id?: ObjectId;
  clinicId: ObjectId;
  voicebotId: ObjectId;
  patient: {
    name: string;
    age: number;
    contact: string;
  };
  visit: {
    reason: string;
    doctor: string;
    startDate: string | Date;
    endDate: string | Date;
  };
  createdAt: string | Date;
};
