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
      const clinicIds = clinics.map((c: any) => c._id);
      const voicebots = await db.voicebots
        .find({ clinicId: { $in: clinicIds } })
        .toArray();
      res.status(200).json({ data: voicebots });
    } catch (err: any) {
      throw createError(500, "Error fetching voicebots");
    }
  })
);

export default router;
