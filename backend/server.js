const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const server = express();
const jwt = require("jsonwebtoken");
server.use(bodyParser.json());

//Establish the database connection

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "story_book",
});

db.connect(function (error) {
  if (error) {
    console.log("Error Connecting to DB");
  } else {
    console.log("successfully Connected to DB");
  }
});

//Establish the Port

server.listen(8085, function check(error) {
  if (error) {
    console.log("Error....dddd!!!!");
  } else {
    console.log("Started....!!!! 8085");
  }
});

/////////////////////////////////////////////////////////////////////
//////////////////////////// USERS //////////////////////////////////
/////////////////////////////////////////////////////////////////////
//Create the Records
server.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  next();
});

server.post("/api/user", (req, res) => {
  try {
    let details = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      role_id: req.body.role_id,
    };
    let sql = "INSERT INTO user SET ?";
    db.query(sql, details, (error, result) => {
      if (error) {
        res.send({ status: false, message: error.message });
      } else {
        getSingleUser(result.insertId, res);
      }
    });
  } catch (error) {
    res.send({ status: false, message: error.message });
  }
});

//view the Records

server.get("/api/user", async (req, res) => {
  try {
    console.log("test");
    var sql =
      "SELECT user.user_id, user.first_name, user.last_name, user.email, role.name as role_name FROM user INNER JOIN role ON user.role_id = role.role_id ORDER By user_id DESC;";
    db.query(sql, function (error, result) {
      if (error) {
        console.log("Error Connecting to DB");
      } else {
        res.send({ status: true, data: result });
      }
    });
  } catch (error) {
    res.send({ status: false, message: error.message });
  }
});

//Search the Records by ID

server.get("/api/user/:id", (req, res) => {
  var userId = req.params.id;
  getSingleUser(userId, res);
});

//Search the Records by Username
server.get("/api/user/check/:username", (req, res) => {
  var sql = `SELECT * FROM user WHERE username = ?`;
  db.query(sql, req.params.username, function (error, result) {
    if (error) {
      res.send({ status: 503, message: error.message });
    } else {
      [user] = result;
      res.send({ status: true, data: user });
    }
  });
});

// Update the Records
server.put("/api/user/:id", (req, res) => {
  try {
    // Assuming req.params.id is the user ID to be updated
    let userId = req.params.id;

    // Extract data from the request body
    let userDetails = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      role_id: req.body.role_id,
    };

    // SQL query with placeholders for parameterized query
    let sql = "UPDATE user SET ? WHERE user_id = ?";

    // Execute the SQL query with userDetails as the data and userId as the role_id
    db.query(sql, [userDetails, userId], (error, result) => {
      if (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ status: false, message: "User Update Failed" });
      }
    });
    getSingleUser(userId, res);
  } catch (error) {
    res.send({ status: false, message: error.message });
  }
});

// Delete the Records
server.delete("/api/user/:id", (req, res) => {
  try {
    // Assuming req.params.id is the user ID to be deleted
    let userId = req.params.id;

    // SQL query with a placeholder for the parameterized query
    let sql = "DELETE FROM user WHERE user_id = ?";

    // Execute the SQL query with userId as the parameter
    db.query(sql, userId, (error) => {
      if (error) {
        res.status(500).send({
          status: false,
          message: `Error deleting user: ${error.message}`,
        });
      } else {
        res
          .status(200)
          .send({ status: true, message: "User Deleted successfully" });
      }
    });
  } catch (error) {}
});

function getSingleUser(id, res) {
  try {
    var sql = `SELECT * FROM user WHERE user_id = ?`;
    db.query(sql, id, function (error, result) {
      if (error) {
        console.log("Error Connecting to DB");
      } else {
        [user] = result;
        res.send({ status: true, data: user });
      }
    });
  } catch (error) {
    throw new TypeError(error.message);
  }
}

/////////////////////////////////////////////////////////////////////
//////////////////////////// Roles //////////////////////////////////
/////////////////////////////////////////////////////////////////////

// Get Roles
server.get("/api/role", (req, res) => {
  try {
    // SQL query with a placeholder for the parameterized query
    let sql = "SELECT * FROM role";

    // Execute the SQL query with userId as the parameter
    db.query(sql, (error, result) => {
      if (error) {
        res.status(500).send({ status: false, message: error.message });
      } else {
        res.status(200).send({ status: true, data: result });
      }
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
});

/////////////////////////////////////////////////////////////////////
//////////////////////////// LOGIN //////////////////////////////////
/////////////////////////////////////////////////////////////////////

server.post("/api/auth", (req, res) => {
  try {
    let username = req.body.username;
    let password = req.body.password;
    // SQL query with a placeholder for the parameterized query
    let sql =
      "SELECT user.user_id, user.first_name, user.last_name, user.email, role.name as role_name FROM user INNER JOIN role ON user.role_id = role.role_id WHERE `username` = ? AND `password` = ?";

    // Execute the SQL query with userId as the parameter
    db.query(sql, [username, password], (error, result) => {
      [user] = result;
      if (!user) {
        res
          .status(200)
          .send({ status: false, message: "Invalid username or password" });
      }
      if (error) {
        res.status(500).send({ status: false, message: error.message });
      } else {
        const jwtBearerToken = jwt.sign({}, "story_book", {
          expiresIn: 120,
          subject: user.user_id.toString(),
        });

        res.cookie("SESSIONID", jwtBearerToken, {
          httpOnly: true,
          secure: true,
        });

        res.status(200).send({
          status: true,
          data: user,
          token: jwtBearerToken,
          exports: 120,
        });
      }
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
});
