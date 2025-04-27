// Shared code goes here

export type AppointmentApi = {
  _id: string;
  clinic: {
    _id: string;
    name: string;
    address: string;
    ownerId: string;
  };
  voicebot: {
    _id: string;
    name: string;
    clinicId: string;
  };
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

export type VoicebotApi = {
  _id: string;
  name: string;
  clinicId: string;
};

export type ClinicApi = {
  _id: string;
  name: string;
  address: string;
  ownerId: string;
};
