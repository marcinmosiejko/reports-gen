import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { getOwnerId } from "../utils/getOwnerId";
import { asyncHandler } from "../utils/asyncHandler";
import createError from "http-errors";

const router = Router({ mergeParams: true });

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const db = getDb();
      const ownerId = await getOwnerId();
      const clinics = await db.clinics.find({ ownerId }).toArray();
      res.status(200).json(clinics);
    } catch (err: any) {
      throw createError(500, "Error fetching clinics");
    }
  })
);

export default router;
