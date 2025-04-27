import { faker } from "@faker-js/faker/locale/en_US";
import { getCollections } from "../db";
import { Db } from "mongodb";
import { Appointment } from "types";

export async function seedDatabase(db: Db) {
  const { owners, clinics, voicebots, appointments, reportJobs } =
    getCollections(db);

  await clinics.createIndex({ ownerId: 1 });
  await appointments.createIndex({ clinicId: 1 });
  await appointments.createIndex({ voicebotId: 1 });
  await voicebots.createIndex({ clinicId: 1 });

  await reportJobs.createIndex({ ownerId: 1 });
  await reportJobs.createIndex({ "filters.voicebotId": 1 });
  await reportJobs.createIndex({ "filters.clinicId": 1 });

  await Promise.all([
    owners.deleteMany({}),
    clinics.deleteMany({}),
    voicebots.deleteMany({}),
    appointments.deleteMany({}),
    reportJobs.deleteMany({}),
  ]);

  const ownerDocs = Array.from({ length: 5 }, () => ({
    name: faker.company.name(),
  }));
  const ownerInsert = await owners.insertMany(ownerDocs);
  const ownerIds = Object.values(ownerInsert.insertedIds);

  const clinicDocs = Array.from({ length: 15 }, (_, i) => ({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    ownerId: ownerIds[i % ownerIds.length],
  }));
  const clinicInsert = await clinics.insertMany(clinicDocs);
  const clinicIds = Object.values(clinicInsert.insertedIds);

  // Seed voicebots, each assigned to exactly one clinic
  const voicebotDocs = clinicIds.flatMap((clinicId) => {
    const numVoicebots = faker.number.int({ min: 1, max: 2 });
    return Array.from({ length: numVoicebots }, () => ({
      name: faker.person.firstName() + " Voicebot",
      clinicId,
    }));
  });
  const voicebotInsert = await voicebots.insertMany(voicebotDocs);
  const voicebotIds = Object.values(voicebotInsert.insertedIds);

  // Map voicebotDocs to include their _id for easier lookup
  const voicebotDocsWithId = voicebotDocs.map((vb, i) => ({
    ...vb,
    _id: voicebotIds[i],
  }));

  // Appointments reference both clinic and voicebot
  const appointmentsInsert: Appointment[] = Array.from({ length: 1000 }, () => {
    // Pick a clinic index
    const clinicIdx = faker.number.int({ min: 0, max: clinicIds.length - 1 });
    const clinicId = clinicIds[clinicIdx];

    // Find all voicebots for this clinic
    const vbArr = voicebotDocsWithId.filter((vb) => vb.clinicId === clinicId);
    // Pick a voicebot for this clinic
    const voicebot = faker.helpers.arrayElement(vbArr);
    const voicebotId = voicebot._id;

    const startDate = faker.date.between({
      from: "2024-04-27T08:00:00Z",
      to: "2025-04-27T20:00:00Z",
    });
    const endDate = new Date(
      startDate.getTime() +
        faker.number.int({ min: 10, max: 20, multipleOf: 5 }) * 60 * 1000
    );
    const createdAt = new Date(
      startDate.getTime() - faker.number.int({ min: 1, max: 100 }) * 60 * 1000
    );
    return {
      clinicId,
      voicebotId,
      patient: {
        name: faker.person.fullName(),
        age: faker.number.int({ min: 1, max: 100 }),
        contact: faker.phone.number(),
      },
      visit: {
        reason: faker.lorem.sentence(),
        doctor: faker.person.fullName(),
        startDate,
        endDate,
      },
      createdAt,
    };
  });
  await appointments.insertMany(appointmentsInsert);
  console.log(
    "Database seeded with normalized collections and example appointments"
  );
}
