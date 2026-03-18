const { sequelize } = require("./server/config/db");
const { QueryTypes } = require("sequelize");

async function fixDatabase() {
  try {
    console.log("Checking for missing columns in 'users' table...");

    // Check if resetRequest column exists
    const tableInfo = await sequelize.query("PRAGMA table_info(users)", {
      type: QueryTypes.SELECT,
    });

    const hasResetRequest = tableInfo.some(
      (col) => col.name === "resetRequest",
    );
    const hasResetRequestedAt = tableInfo.some(
      (col) => col.name === "resetRequestedAt",
    );

    if (!hasResetRequest) {
      console.log("Adding 'resetRequest' column...");
      await sequelize.query(
        "ALTER TABLE users ADD COLUMN resetRequest BOOLEAN DEFAULT 0",
      );
    } else {
      console.log("'resetRequest' column already exists.");
    }

    if (!hasResetRequestedAt) {
      console.log("Adding 'resetRequestedAt' column...");
      await sequelize.query(
        "ALTER TABLE users ADD COLUMN resetRequestedAt DATETIME",
      );
    } else {
      console.log("'resetRequestedAt' column already exists.");
    }

    console.log("Database schema fix completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing database schema:", error.message);
    process.exit(1);
  }
}

fixDatabase();
