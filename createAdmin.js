const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Admin = require("./models/Admin");

dotenv.config();

const createAdmin = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not defined in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const adminsToCreate = [
      { username: "admin", password: "password123" },
      { username: "admin2", password: "password123" },
    ];

    for (const adminData of adminsToCreate) {
      // Check if admin exists
      const existingUser = await User.findOne({
        user_name: adminData.username,
      });
      if (existingUser) {
        console.log(
          `Admin user '${adminData.username}' already exists. Skipping.`
        );
        continue;
      }

      // Create User
      const adminUser = new User({
        user_name: adminData.username,
        password: adminData.password,
        role: "admin",
      });
      await adminUser.save();
      console.log(
        `Admin User '${adminData.username}' created with ID:`,
        adminUser._id
      );

      // Create Admin Profile
      const adminProfile = new Admin({
        user_id: adminUser._id,
      });
      await adminProfile.save();
      console.log(`Admin Profile for '${adminData.username}' created.`);
    }

    console.log("-----------------------------------------");
    console.log("Admin Creation Process Completed");
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
