const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const uri = MONGO_URI;
const client = new MongoClient(uri);
const SALT_ROUNDS = 10;

async function migratePasswords() {
  await client.connect();
  const db = client.db("attend_sys");

  const users = await db.collection("users").find({}).toArray();

  for (const user of users) {
    // Skip already hashed passwords
    // if (user.password.startsWith("$2b$")) continue;

    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: hashed } }
    );
  }

  console.log("✅ Password migration completed");
  await client.close();
}

migratePasswords();
