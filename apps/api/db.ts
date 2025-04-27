import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db, Collection } from "mongodb";
import { Appointment, Clinic, Owner, Voicebot } from "types";
import { seedDatabase } from "./utils/seedDb";

type DatabaseCollections = {
  owners: Collection<Owner>;
  clinics: Collection<Clinic>;
  voicebots: Collection<Voicebot>;
  appointments: Collection<Appointment>;
};

export function getCollections(db: Db): DatabaseCollections {
  return {
    owners: db.collection<Owner>("owners"),
    clinics: db.collection<Clinic>("clinics"),
    voicebots: db.collection<Voicebot>("voicebots"),
    appointments: db.collection<Appointment>("appointments"),
  };
}

let mongoServer: MongoMemoryServer | null = null;
let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let initialized = false;

export async function dbInit(): Promise<Db> {
  if (initialized && dbInstance) return dbInstance;
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();
  dbInstance = client.db();
  await seedDatabase(dbInstance);
  initialized = true;
  console.log("In-memory MongoDB initialized and seeded");
  return dbInstance;
}

export function getDb(): DatabaseCollections {
  if (!dbInstance)
    throw new Error("Database not initialized. Call dbInit() first.");
  return getCollections(dbInstance);
}

export async function closeDatabase() {
  if (client) await client.close();
  if (mongoServer) await mongoServer.stop();
  dbInstance = null;
  initialized = false;
}
