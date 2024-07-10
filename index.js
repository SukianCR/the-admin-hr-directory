const express = require("express");
const app = express();
const pg = require("pg");
app.use(express.json());
//app.use(require("morgan")("dev"));
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_hr_directory_db"
);
const PORT = process.env.PORT || 3010;

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * from departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL =
      "INSERT INTO employees(name, department_id) values ($1, $2) RETURNING *";
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

const init = async () => {
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        name VARCHAR(255) NOT NULL,
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  SQL = `
    INSERT INTO departments(name) values('AMERICAN BULL DOG');
    INSERT INTO departments(name) values('Pekingese');
    INSERT INTO departments(name) values('BEAGLE');
    INSERT INTO departments(name) values('BLACK LAB');
    INSERT INTO employees(name, age, department_id) values('BETTY', 9, (SELECT id from breeds WHERE breed='AMERICAN BULL DOG'));
    INSERT INTO employees(name, age, department_id) values('LEO', 10, (SELECT id from breeds WHERE breed='BEAGLE'));
    INSERT INTO employees(name, age, department_id) values('MOTI', 2, (SELECT id from breeds WHERE breed='Pekingese'));
  `;
  await client.query(SQL);
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
};

init();
