import { getDb } from "../db";

export const getOwnerId = async () => {
  // For demo just use the first owner, in prod it would be for example in a request (added in auth middleware)
  const db = getDb();
  const owner = (await db.owners.findOne({}, { sort: { _id: 1 } }))!;
  return owner._id;
};
