const express = require("express");
const app = express();
const pg = require("pg");
app.use(express.json());
//app.use(require("morgan")("dev"));
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_hr_directory_db"
);
const PORT = process.env.PORT || 3000;

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

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    console.log(ex);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE from employees
        WHERE id = $1
      `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    console.log(ex);
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
    INSERT INTO departments(name) values('food_beverages');
    INSERT INTO departments(name) values('housekeeping');
    INSERT INTO departments(name) values('events');
    INSERT INTO departments(name) values('security');
    INSERT INTO employees(name,department_id) values('Lucia', (SELECT id from departments WHERE name='food_beverages'));
    INSERT INTO employees(name, department_id) values('Leo',  (SELECT id from departments WHERE name='events'));
     INSERT INTO employees(name, department_id) values('Sara',  (SELECT id from departments WHERE name='events'));
    INSERT INTO employees(name, department_id) values('Mario',  (SELECT id from departments WHERE name='security'));
  `;
  await client.query(SQL);
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
};

init();
