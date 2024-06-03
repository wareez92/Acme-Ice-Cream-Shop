// --- import pg and create a client ---

const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_ice_cream_shop"
);

// --- import express and store in app ---

const express = require("express");
const app = express();

// --- init function

const init = async () => {
  try {
    // --- connect client to database ---
    await client.connect();

    // --- create table query and seed data ---
    let SQL = `DROP TABLE IF EXISTS flavors;
               CREATE TABLE flavors(
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(30) NOT NULL,
                    is_favorite BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT now(),
                    updated_at TIMESTAMP DEFAULT now()
                );
                INSERT INTO flavors (name, is_favorite) VALUES ('strawberry', true);
                INSERT INTO flavors (name, is_favorite) VALUES ('blueberry', false);
                INSERT INTO flavors (name, is_favorite) VALUES ('cherry', false);`;
    await client.query(SQL);
    console.log("data seeded");

    // --- create port and listener ---
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (error) {
    console.error(error);
  }
};

// --- invoke init ---
init();

// --- add parsers and log incoming request ---
app.use(express.json());
app.use(require("morgan")("dev"));

// --- CRUD SECTION ---

// ~~~ read flavors ~~~

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// ~~~ read flavor by id ~~~

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id = $1`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ~~~ create flavors ~~~

app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO flavors (name, is_favorite)
                 VALUES ($1, $2)
                 RETURNING *`;
    const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ~~~ delete flavors ~~~

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM flavors WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// ~~~ update flavors ~~~

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `UPDATE flavors
                 SET name = $1, is_favorite = $2, updated_at = now()
                 WHERE id = $3
                 RETURNING *`;
    const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});