const { Sequelize } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database.sqlite"),
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("SQLite Connected");
    console.log(`📊 Database: SQLite offline file`);

    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Database tables synchronized");
  } catch (error) {
    console.error("SQLite Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
