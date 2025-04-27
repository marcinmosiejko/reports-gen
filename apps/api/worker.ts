import { getDb } from "./db";
import { JobStatus, ReportJob } from "./types";
import { jobEvents } from "./events/jobEvents";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { stringify } from "csv";
import { _ } from "@faker-js/faker/dist/airline-BUL6NtOJ";

const FAKE_WAIT_TIME_SEC = 5; // Simulate a long-running process

async function processJob(job: ReportJob) {
  console.log(`Processing job ${job._id}...`);
  try {
    const db = getDb();

    await fs.mkdir("reports", { recursive: true });

    await db.reportJobs.updateOne(
      { _id: job._id },
      { $set: { status: JobStatus.Processing, updatedAt: new Date() } }
    );

    jobEvents.emit("updated", { ...job, status: JobStatus.Processing });

    const appointmentsCursor = db.appointments.aggregate([
      {
        $match: {
          createdAt: {
            $gte: job.filters.startDate,
            $lte: job.filters.endDate,
          },
          ...(job.filters.voicebotId && {
            voicebotId: job.filters.voicebotId,
          }),
          ...(job.filters.clinicId && { clinicId: job.filters.clinicId }),
        },
      },
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
          _id: 0, // Exclude _id from the output
          "Patient Name": "$patient.name",
          "Patient Age": "$patient.age",
          "Patient Contact": "$patient.contact",
          "Visit Reason": "$visit.reason",
          "Visit Doctor": "$visit.doctor",
          "Visit Start": { $dateToString: { date: "$visit.startDate" } },
          "Visit End": { $dateToString: { date: "$visit.endDate" } },
          "Clinic Name": "$clinic.name",
          "Clinic Address": "$clinic.address",
          "Voicebot Name": "$voicebot.name",
          "Created At": { $dateToString: { date: "$createdAt" } },
        },
      },
    ]);

    const reportPath = `reports/${job._id}.csv`;

    const stringifier = stringify({
      header: true,
      columns: [
        { key: "Patient Name", header: "Patient Name" },
        { key: "Patient Age", header: "Patient Age" },
        { key: "Patient Contact", header: "Patient Contact" },
        { key: "Visit Reason", header: "Visit Reason" },
        { key: "Visit Doctor", header: "Visit Doctor" },
        { key: "Visit Start", header: "Visit Start" },
        { key: "Visit End", header: "Visit End" },
        { key: "Clinic Name", header: "Clinic Name" },
        { key: "Clinic Address", header: "Clinic Address" },
        { key: "Voicebot Name", header: "Voicebot Name" },
        { key: "Created At", header: "Created At" },
      ],
    });

    const writeStream = createWriteStream(reportPath);

    await new Promise((resolve) =>
      setTimeout(resolve, FAKE_WAIT_TIME_SEC * 1000)
    );
    await pipeline(appointmentsCursor.stream(), stringifier, writeStream);

    await db.reportJobs.updateOne(
      { _id: job._id },
      {
        $set: {
          status: JobStatus.Completed,
          reportPath,
          updatedAt: new Date(),
        },
      }
    );

    jobEvents.emit("updated", {
      ...job,
      status: JobStatus.Completed,
      reportPath,
    });
  } catch (error) {
    console.error(`Error processing job ${job._id}:`, error);

    await getDb().reportJobs.updateOne(
      { _id: job._id },
      { $set: { status: JobStatus.Failed, updatedAt: new Date() } }
    );

    jobEvents.emit("updated", { ...job, status: JobStatus.Failed });
  }
}

async function pollForJobs() {
  console.log("Polling for jobs...");
  try {
    const pendingJobs = getDb().reportJobs.find({
      status: JobStatus.Pending,
    });
    for await (const job of pendingJobs) {
      processJob(job);
    }
  } catch (error) {
    console.error("Error polling for jobs:", error);
  } finally {
    setTimeout(pollForJobs, 5000);
  }
}

async function deleteOldReports() {
  console.log("Deleting old reports...");
  try {
    // in prod it could be 1 day, but for demo testing we set it to 2 minutes
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

    const db = getDb();
    const oldJobs = db.reportJobs.find({
      status: JobStatus.Completed,
      updatedAt: { $lt: twoMinutesAgo },
    });
    for await (const job of oldJobs) {
      await db.reportJobs.deleteOne({ _id: job._id });
      jobEvents.emit("updated", {
        _id: job._id,
        ownerId: job.ownerId,
        status: JobStatus.Deleted,
      });

      if (job.reportPath) {
        try {
          await fs.unlink(job.reportPath);
          console.log(`Deleted report file: ${job.reportPath}`);
        } catch (err) {
          console.error(`Failed to delete report file: ${job.reportPath}`, err);
        }
      }

      console.log(`Deleted job record: ${job._id}`);
    }
  } catch (error) {
    console.error("Error deleting old reports:", error);
  } finally {
    setTimeout(deleteOldReports, 30 * 1000);
  }
}

export function startWorker() {
  console.log("Starting job processing worker...");
  pollForJobs();
  deleteOldReports();
}
