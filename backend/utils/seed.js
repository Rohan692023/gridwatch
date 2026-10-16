require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Zone = require("../models/Zone");
const GridSettings = require("../models/GridSettings");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gridwatch.dev";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD must be set before running the seed script");
  }

  const passwordHash = await User.hashPassword(adminPassword);
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({ name: "Grid Admin", email: adminEmail, passwordHash, role: "admin" });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    await User.findOneAndUpdate(
      { email: adminEmail },
      { name: "Grid Admin", passwordHash, role: "admin" },
      { new: true }
    );
    console.log(`Updated admin user: ${adminEmail}`);
  }

  const zoneCount = await Zone.countDocuments();
  if (zoneCount === 0) {
    await Zone.insertMany([
      { name: "City Hospital", priority: 1, baseLoadKw: 120, currentLoadKw: 120 },
      { name: "Water Treatment Plant", priority: 1, baseLoadKw: 80, currentLoadKw: 80 },
      { name: "Residential Sector A", priority: 2, baseLoadKw: 150, currentLoadKw: 150 },
      { name: "Residential Sector B", priority: 2, baseLoadKw: 140, currentLoadKw: 140 },
      { name: "Commercial District", priority: 2, baseLoadKw: 100, currentLoadKw: 100 },
      { name: "Industrial Park", priority: 3, baseLoadKw: 180, currentLoadKw: 180 },
      { name: "Municipal Park Lighting", priority: 3, baseLoadKw: 30, currentLoadKw: 30 },
    ]);
    console.log("Created demo zones");
  }

  await GridSettings.getSingleton();
  console.log("Grid settings initialized");

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
