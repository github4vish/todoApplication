//ccbp start NJSCADOQBS

const express = require("express");
const { format, isValid, toDate } = require("date-fns");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const paramValidity = (req, res, next) => {
  const { priority, status, category, date } = req.query;

  newFunction(date, res, priority, status, category, req, next);
};

const bodyValidity = (req, res, next) => {
  const { priority, status, category, dueDate } = req.body;

  newFunction(dueDate, res, priority, status, category, req, next);
};

//API 1
app.get("/todos/", paramValidity, async (req, res) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = req.query;
  const q = `SELECT 
                    id,
                    todo,
                    priority,
                    status,
                    category,
                    due_date AS dueDate
            FROM todo
            WHERE 
                status LIKE '%${status}%' AND
                priority LIKE'%${priority}%' AND
                category LIKE'%${category}%' AND
                todo LIKE  '%${search_q}%'`;

  const list = await db.all(q);
  res.send(list);
});

//API 2
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const q = `SELECT 
                    id,
                    todo,
                    priority,
                    status,
                    category,
                    due_date AS dueDate
            FROM todo
            WHERE id=${todoId}`;

  const obj = await db.get(q);
  res.send(obj);
});

//API3
app.get("/agenda/", paramValidity, async (req, res) => {
  const { date } = req;
  const q = `SELECT 
                    id,
                    todo,
                    priority,
                    status,
                    category,
                    due_date AS dueDate
            FROM todo
            WHERE due_date =  '${date}'`;

  const list = await db.all(q);
  res.send(list);
});

//api1
app.post("/todos/", bodyValidity, async (req, res) => {
  const { id, todo, priority, status, category } = req.body;
  const { date } = req;

  const q = `INSERT INTO todo(id, todo, priority, status, category, due_date) 
            VALUES(
                '${id}',
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${date}'
            )`;
  await db.run(q);
  res.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", bodyValidity, async (req, res) => {
  const { todoId } = req.params;
  const { todo, priority, status, category } = req.body;
  const { date } = req;
  const q = `UPDATE  todo
            SET
                todo= CASE WHEN '${todo}' != 'undefined' THEN  '${todo}'  ELSE todo END,
                priority= CASE WHEN '${priority}' != 'undefined' THEN  '${priority}'  ELSE priority END,
                status= CASE WHEN '${status}' != 'undefined' THEN  '${status}'  ELSE status END,
                category= CASE WHEN '${category}' != 'undefined' THEN  '${category}'  ELSE category END,
                due_date= CASE WHEN '${date}' != 'undefined' THEN  '${date}'  ELSE due_date END
            WHERE id=${todoId}`;

  await db.run(q);

  r =
    todo !== undefined
      ? "Todo"
      : priority !== undefined
      ? "Priority"
      : status !== undefined
      ? "Status"
      : category !== undefined
      ? "Category"
      : "Due Date";

  res.send(r + " Updated");
});

//API 6
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const q = `DELETE FROM todo
            WHERE id=${todoId}`;

  await db.run(q);
  res.send("Todo Deleted");
});

module.exports = app;
function newFunction(date, res, priority, status, category, req, next) {
  pl = ["HIGH", "MEDIUM", "LOW", undefined];
  sl = ["TO DO", "IN PROGRESS", "DONE", undefined];
  cl = ["WORK", "HOME", "LEARNING", undefined];
  let df;
  if (date !== undefined) {
    try {
      df = format(new Date(date), "yyyy-MM-dd");
      v = toDate(new Date(df));
      d = date === undefined ? true : isValid(v);
    } catch (e) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    }
  }
  p = pl.includes(priority);
  s = sl.includes(status);
  c = cl.includes(category);
  if (p && s && c) {
    req.date = df;
    next();
  } else {
    res.status(400);
    r = !p ? "Priority" : !s ? "Status" : "Category";
    res.send("Invalid Todo " + r);
  }
}
