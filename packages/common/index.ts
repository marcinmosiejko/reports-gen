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

export enum JobStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Deleted = "deleted",
}

export type ReportJobApi = {
  _id: string;
  ownerId: string;
  status: JobStatus;
  reportPath?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  filters: {
    voicebotId?: string;
    clinicId?: string;
    voicebotName?: string;
    clinicName?: string;
    startDate: string | Date;
    endDate: string | Date;
  };
};
