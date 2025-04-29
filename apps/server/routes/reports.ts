import express, { Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../db";
import { ObjectId } from "mongodb";
import { JobStatus, ReportJob } from "../types";
import { getOwnerId } from "../utils/getOwnerId";
import { asyncHandler } from "../utils/asyncHandler";
import createError from "http-errors";
import { jobEvents } from "../events/jobEvents";
import fs from "fs";

const router = express.Router({ mergeParams: true });

const reportJobchema = z.object({
  clinicId: z
    .string()
    .optional()
    .refine(
      (id) => id === undefined || ObjectId.isValid(id),
      "Invalid Clinic ID"
    ),
  voicebotId: z
    .string()
    .optional()
    .refine(
      (id) => id === undefined || ObjectId.isValid(id),
      "Invalid Clinic ID"
    ),
  startDate: z
    .string()
    .nonempty()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z
    .string()
    .nonempty()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
});

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { voicebotId, clinicId, startDate, endDate } = reportJobchema.parse(
        req.body
      );
      // TODO:
      // check if startDate is before endDate
      // check if startDate is in the past
      // check if endDate is not in the future
      // don't allow overlapping jobs

      const db = getDb();
      const ownerId = await getOwnerId();

      const newJob: ReportJob = {
        ownerId: new ObjectId(ownerId),
        status: JobStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
        filters: {
          ...(voicebotId && { voicebotId: new ObjectId(voicebotId) }),
          ...(clinicId && { clinicId: new ObjectId(clinicId) }),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      };

      const result = await db.reportJobs.insertOne(newJob);

      const jobStatusUrl = `/reports/${result.insertedId}`;

      res.status(202).location(jobStatusUrl).json({
        message: "Job scheduled successfully",
        jobId: result.insertedId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.message);
        throw createError(400, error.message, { errors: error.errors });
      }
      throw error;
    }
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const ownerId = await getOwnerId();

    const jobs = await db.reportJobs
      .aggregate([
        { $match: { ownerId } },
        {
          $lookup: {
            from: "voicebots",
            localField: "filters.voicebotId",
            foreignField: "_id",
            as: "voicebot",
          },
        },
        {
          $lookup: {
            from: "clinics",
            localField: "filters.clinicId",
            foreignField: "_id",
            as: "clinic",
          },
        },
        {
          $project: {
            _id: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            reportPath: 1,
            filters: {
              startDate: 1,
              endDate: 1,
              voicebotId: 1,
              clinicId: 1,
              voicebotName: { $arrayElemAt: ["$voicebot.name", 0] },
              clinicName: { $arrayElemAt: ["$clinic.name", 0] },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.status(200).json(jobs);
  })
);

router.get(
  "/subscribe",
  asyncHandler(async (req: Request, res: Response) => {
    const ownerId = await getOwnerId();
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const onUpdate = (job: ReportJob) => {
      if (job.ownerId.equals(ownerId)) {
        res.write(`event: update\ndata: ${JSON.stringify(job)}\n\n`);
      }
    };

    jobEvents.on("updated", onUpdate);

    req.on("close", () => {
      jobEvents.off("updated", onUpdate);
    });
  })
);

router.get(
  "/:jobId",
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    if (!ObjectId.isValid(jobId)) throw createError(400, "Bad jobId");
    const job = await getDb().reportJobs.findOne({
      _id: new ObjectId(jobId),
      ownerId: new ObjectId(await getOwnerId()),
    });
    if (!job) throw createError(404, "Not found");
    res.status(200).json(job);
  })
);

router.get(
  "/:jobId/download",
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    if (!ObjectId.isValid(jobId)) throw createError(400, "Invalid jobId");

    const db = getDb();
    const job = await db.reportJobs.findOne({
      _id: new ObjectId(jobId),
    });

    if (!job || !job.ownerId.equals(new ObjectId(await getOwnerId()))) {
      throw createError(404, "Not found");
    }
    if (job.status !== JobStatus.Completed || !job.reportPath) {
      throw createError(400, "Report not ready");
    }

    const startDate = new Date(job.filters.startDate)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(job.filters.endDate).toISOString().split("T")[0];
    const dateRange = `${startDate}_to_${endDate}`;
    const voicebotName =
      job.filters.voicebotId &&
      (
        await db.voicebots.findOne({
          _id: job.filters.voicebotId,
        })
      )?.name;
    const clinicName =
      job.filters.clinicId &&
      (
        await db.clinics.findOne({
          _id: job.filters.clinicId,
        })
      )?.name;
    const voicebotPart = voicebotName
      ? `_voicebot-${voicebotName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
      : "_all-voicebots";

    const clinicPart = clinicName
      ? `_clinic-${clinicName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
      : "_all-clinics";

    const downloadFileName = `report_${dateRange}${voicebotPart}${clinicPart}.csv`;

    try {
      await fs.promises.access(job.reportPath, fs.constants.R_OK); // Check for read permission
    } catch (err: any) {
      throw createError(404, "Report file not found");
    }

    res.download(job.reportPath, downloadFileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        if (!res.headersSent) {
          throw createError(500, "Failed to download file");
        }
      }
    });
  })
);

export default router;
