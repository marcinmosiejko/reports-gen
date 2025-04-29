import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { getOwnerId } from "../utils/getOwnerId";
import type { AppointmentApi } from "common";
import { asyncHandler } from "../utils/asyncHandler";
import createError from "http-errors";
import { ObjectId } from "mongodb";

const router = Router();

export const makeAppointmentsPipeline = (ownerId: ObjectId) => [
  {
    $lookup: {
      from: "clinics",
      localField: "clinicId",
      foreignField: "_id",
      as: "clinic",
    },
  },
  { $unwind: "$clinic" },
  {
    $match: {
      "clinic.ownerId": ownerId,
    },
  },
  {
    $lookup: {
      from: "voicebots",
      localField: "voicebotId",
      foreignField: "_id",
      as: "voicebot",
    },
  },
  { $unwind: "$voicebot" },
  {
    $project: {
      _id: 1,
      patient: 1,
      visit: 1,
      createdAt: 1,
      clinic: {
        _id: "$clinic._id",
        name: "$clinic.name",
        address: "$clinic.address",
      },
      voicebot: {
        _id: "$voicebot._id",
        name: "$voicebot.name",
      },
    },
  },
];

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const db = getDb();
      const ownerId = await getOwnerId();
      const appointmentsWithClinicAndVoicebot = await db.appointments
        .aggregate<AppointmentApi>(makeAppointmentsPipeline(ownerId))
        .toArray();
      res.status(200).json({ data: appointmentsWithClinicAndVoicebot });
    } catch (error: any) {
      throw createError(500, "Error fetching appointments");
    }
  })
);

export default router;
