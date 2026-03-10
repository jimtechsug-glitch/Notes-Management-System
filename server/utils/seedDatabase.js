const User = require("../models/User");
const Subject = require("../models/Subject");
const { ALEVEL_COMBINATIONS, OLEVEL_SUBJECTS } = require("../config/config");

const seedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: "admin" } });

    if (adminExists) {
      console.log("Admin already exists. Skipping seed.");
      // Still seed subjects if they don't exist
      await seedOLevelSubjects();
      await seedALevelSubjects();
      return;
    }

    const admin = await User.create({
      name: "System Admin",
      email: process.env.ADMIN_EMAIL || "admin@school.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "admin",
      isConfirmed: true,
      isActive: true,
    });

    console.log("Admin created successfully via auto-seed");
    console.log(`Email: ${admin.email}`);

    // Seed all subjects
    await seedOLevelSubjects();
    await seedALevelSubjects();
  } catch (error) {
    console.error("Auto-seeding error:", error.message);
  }
};

// Seed O-Level subjects for S1-S4
const seedOLevelSubjects = async () => {
  try {
    const oLevelClasses = ["s1", "s2", "s3", "s4"];

    for (const classLevel of oLevelClasses) {
      for (const subject of OLEVEL_SUBJECTS) {
        const exists = await Subject.findOne({
          where: {
            name: subject,
            level: "o-level",
            class: classLevel,
          },
        });

        if (!exists) {
          await Subject.create({
            name: subject,
            code: subject.substring(0, 3).toUpperCase(),
            level: "o-level",
            class: classLevel,
            isCompulsory: true,
            isActive: true,
          });
          console.log(`Created O-Level subject: ${subject} (${classLevel})`);
        }
      }
    }

    console.log("O-Level subjects seeded successfully");
  } catch (error) {
    console.error("Error seeding O-Level subjects:", error.message);
  }
};

// Seed A-Level subjects based on ALEVEL_COMBINATIONS configuration
const seedALevelSubjects = async () => {
  try {
    // Subject categorization by stream
    const subjectStreamMap = {
      // Science subjects
      Physics: "science",
      Chemistry: "science",
      Biology: "science",
      // Both science and arts
      Mathematics: "both",
      Geography: "both",
      // Arts subjects
      History: "arts",
      Economics: "arts",
      Literature: "arts",
      Divinity: "arts",
      Arabic: "arts",
      Kiswahili: "arts",
      "Religious Education": "arts",
    };

    // Extract unique subjects from combinations
    const subjects = new Set();
    Object.values(ALEVEL_COMBINATIONS).forEach((combo) => {
      combo.subjects.forEach((subject) => subjects.add(subject));
    });

    // Create subjects for S5 and S6 if they don't exist
    for (const subject of subjects) {
      const stream = subjectStreamMap[subject] || "both";

      for (const classLevel of ["s5", "s6"]) {
        const exists = await Subject.findOne({
          where: {
            name: subject,
            level: "a-level",
            class: classLevel,
          },
        });

        if (!exists) {
          await Subject.create({
            name: subject,
            code: subject.substring(0, 3).toUpperCase(),
            level: "a-level",
            class: classLevel,
            stream: stream,
            isCompulsory: true,
            isActive: true,
          });
          console.log(
            `Created A-Level subject: ${subject} (${classLevel}, ${stream})`,
          );
        }
      }
    }

    console.log("A-Level subjects seeded successfully");
  } catch (error) {
    console.error("Error seeding A-Level subjects:", error.message);
  }
};

module.exports = seedDatabase;
