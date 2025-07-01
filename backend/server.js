const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("flight_mgmt.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    dob TEXT,
    email TEXT,
    gender TEXT,
    balance INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    cost INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER,
    task TEXT,
    cost INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    courseId INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    taskId INTEGER
  )`);

  // Example course (remove or modify as needed)
  db.run(`INSERT OR IGNORE INTO courses (id, name, description, cost)
          VALUES (1, 'Flight Basics', 'Introduction to aviation', 3000)`);

  // Example tasks (remove or modify as needed)
  db.run(`INSERT OR IGNORE INTO tasks (id, courseId, task, cost)
          VALUES 
            (1, 1, 'Take-off Assignment', 500),
            (2, 1, 'Landing Practice', 700)`);
});

// ✅ Student Registration
app.post("/register-student", (req, res) => {
  const { name, dob, email, gender } = req.body;

  db.run(
    `INSERT INTO users (name, dob, email, gender, balance) VALUES (?, ?, ?, ?, 0)`,
    [name, dob, email, gender],
    function (err) {
      if (err) return res.status(500).send({ error: err });
      res.send({ success: true, userId: this.lastID });
    },
  );
});

// ✅ Get Student Info
app.get("/user/:id", (req, res) => {
  db.get(
    `SELECT name, dob, email, gender FROM users WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).send({ error: err });
      res.send(row);
    },
  );
});

// ✅ Get Balance
app.get("/balance/:id", (req, res) => {
  db.get(
    `SELECT balance FROM users WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).send({ error: err });
      res.send(row);
    },
  );
});

// ✅ Add Balance
app.post("/add-balance", (req, res) => {
  const { userId, amount } = req.body;
  db.run(
    `UPDATE users SET balance = balance + ? WHERE id = ?`,
    [amount, userId],
    function (err) {
      if (err) return res.status(500).send({ error: err });
      res.send({ success: true });
    },
  );
});

// ✅ Get All Courses
app.get("/courses", (req, res) => {
  db.all("SELECT * FROM courses", (err, rows) => {
    if (err) return res.status(500).send({ error: err });
    res.send(rows);
  });
});

// ✅ Get Tasks for a Course
app.get("/tasks/:courseId", (req, res) => {
  db.all(
    "SELECT * FROM tasks WHERE courseId = ?",
    [req.params.courseId],
    (err, rows) => {
      if (err) return res.status(500).send({ error: err });
      res.send(rows);
    },
  );
});

// ✅ Enroll in Course
app.post("/enroll", (req, res) => {
  const { userId, courseId } = req.body;
  db.get(
    `SELECT * FROM enrollments WHERE userId = ? AND courseId = ?`,
    [userId, courseId],
    (err, row) => {
      if (row) return res.status(400).send({ error: "Already enrolled" });
      db.run(`INSERT INTO enrollments (userId, courseId) VALUES (?, ?)`, [
        userId,
        courseId,
      ]);
      res.send({ success: true });
    },
  );
});

// ✅ Complete Task
app.post("/complete-task", (req, res) => {
  const { userId, taskId } = req.body;

  db.get(
    `SELECT * FROM completions WHERE userId = ? AND taskId = ?`,
    [userId, taskId],
    (err, row) => {
      if (row) return res.status(400).send({ error: "Already completed" });

      db.get(`SELECT cost FROM tasks WHERE id = ?`, [taskId], (err, task) => {
        db.get(
          `SELECT balance FROM users WHERE id = ?`,
          [userId],
          (err, user) => {
            if (user.balance < task.cost)
              return res.status(400).send({ error: "Insufficient balance" });

            db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [
              task.cost,
              userId,
            ]);
            db.run(`INSERT INTO completions (userId, taskId) VALUES (?, ?)`, [
              userId,
              taskId,
            ]);
            res.send({ success: true });
          },
        );
      });
    },
  );
});

// ✅ Get Progress
app.get("/progress/:userId", (req, res) => {
  db.all(
    `SELECT tasks.task FROM completions
     JOIN tasks ON completions.taskId = tasks.id
     WHERE completions.userId = ?`,
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).send({ error: err });
      res.send(rows);
    },
  );
});

// ✅ Admin: Add Course
app.post("/admin/add-course", (req, res) => {
  const { name, description, cost } = req.body;
  db.run(
    `INSERT INTO courses (name, description, cost) VALUES (?, ?, ?)`,
    [name, description, cost],
    function (err) {
      if (err) return res.status(500).send({ error: err });
      res.send({ success: true, courseId: this.lastID });
    },
  );
});

// ✅ Admin: Add Task
app.post("/admin/add-task", (req, res) => {
  const { courseId, task, cost } = req.body;
  db.run(
    `INSERT INTO tasks (courseId, task, cost) VALUES (?, ?, ?)`,
    [courseId, task, cost],
    function (err) {
      if (err) return res.status(500).send({ error: err });
      res.send({ success: true });
    },
  );
});

// ✅ Admin: Get All Students
app.get("/admin/students", (req, res) => {
  db.all("SELECT id, name, dob, email, gender FROM users", (err, rows) => {
    if (err) return res.status(500).send({ error: err });
    res.send(rows);
  });
});

// ✅ Admin: Get All Progress
app.get("/admin/progress", (req, res) => {
  db.all(
    `SELECT users.name, tasks.task FROM completions
     JOIN users ON completions.userId = users.id
     JOIN tasks ON completions.taskId = tasks.id`,
    (err, rows) => {
      if (err) return res.status(500).send({ error: err });
      res.send(rows);
    },
  );
});

app.listen(port, () => {
  console.log(`✈️ Flight Management System backend running on port ${port}`);
});
