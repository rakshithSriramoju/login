const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let database = null;

const intilizerServerAndDatabase = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Is Activated"));
  } catch (error) {
    console.log(`dbError : ${error.message}`);
    process.exit(1);
  }
};
intilizerServerAndDatabase();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const userdetails = `
    SELECT 
    *
    FROM user
    WHERE username='${username}'
    `;
  const databaseUser = await database.get(userdetails);
  if (databaseUser === undefined) {
    const createuser = `
            INSERT INTO user (username,name,password,gender,location)
            VALUES 
            ('${username}','${name}','${hashPassword}','${gender}','${location}');`;

    if (password.length > 4) {
      await database.run(createuser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hash = await bcrypt.hash(newPassword, 10);
  const createuser = `
        SELECT
        *
        FROM user 
        WHERE username='${username}'
        `;

  const result1 = await database.get(createuser);

  if (result1 === undefined) {
    response.status(400);
    response.send("InvalidUser");
  } else {
    const hashPassword = await bcrypt.compare(oldPassword, result1.password);
    const createuser = `
      UPDATE user
      SET 
      password='${hash}'
      WHERE username='${username}'
      `;
    if (hashPassword === true) {
      if (newPassword.length > 4) {
        await database.run(createuser);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
