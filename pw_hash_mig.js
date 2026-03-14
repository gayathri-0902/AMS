const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const SALT_ROUNDS = 10;

async function migratePasswords() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const users = await db.collection("users").find({}).toArray();

  console.log("Users found:", users.length);

    let updated = 0;

  for (const user of users) {
    if (!user.password || typeof user.password !== "string") continue;

    // Skip already hashed passwords
    if (user.password.startsWith("$2")) {
      console.log(`Skipping ${user.user_name}`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);

    const result = await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: hashed } }
    );

    if (result.modifiedCount === 1) {
      updated++;
      console.log(`Hashed password for ${user.user_name}`);
    }
  }

  console.log(`✅ Migration completed. Updated ${updated} users.`);
  await mongoose.disconnect();
}

migratePasswords().catch(console.error);

