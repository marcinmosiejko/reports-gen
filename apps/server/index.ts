import express, { json, NextFunction, Request, Response } from "express";
import cors from "cors";
import { dbInit } from "./db";
import appointmentsRouter from "./routes/appointments";
import clinicsRouter from "./routes/clinics";
import voicebotsRouter from "./routes/voicebots";
import reportsRouter from "./routes/reports";
import { startWorker } from "./worker";

const app = express();
const port = 3001;

app.use(cors());
app.use(json());

app.get("/", (_req: Request, res: Response) => {
  res.json([{ id: 1, title: "First report" }]);
});

app.use("/appointments", appointmentsRouter);
app.use("/clinics", clinicsRouter);
app.use("/voicebots", voicebotsRouter);
app.use("/reports", reportsRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

(async () => {
  await dbInit();
  app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
  });
  startWorker();
})();
