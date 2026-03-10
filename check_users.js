const { connectDB } = require("./server/config/db");
const User = require("./server/models/User");
const dotenv = require("dotenv");
dotenv.config();

async function checkUsers() {
  await connectDB();
  const users = await User.findAll({ attributes: ["id", "email", "role"] });
  console.log("Users in database:");
  users.forEach((u) => {
    console.log(`- ${u.email}: ${u.role}`);
  });
  process.exit(0);
}

checkUsers();
