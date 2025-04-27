import express, { json, Request, Response } from "express";
import cors from "cors";

const app = express();
const port = 3001;

app.use(cors());
app.use(json());

app.get("/", (_req: Request, res: Response) => {
  res.json([{ id: 1, title: "First report" }]);
});

app.listen(port, () => {
  console.log(`API listening on port: ${port}`);
});
