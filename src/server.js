require('dotenv').config();
// susikuriam serveri
const express = require('express');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const dbConfig = require('./config');

const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
// prisidedam morgan/cors
// GET / - msg: server online

app.get('/', (req, res) => {
  res.json({
    msg: 'Server online',
  });
});

// ROUTES
// GET /api/articles - grazina visus postus
app.get('/api/articles', async (req, res) => {
  // gauti query parametrus
  console.log('req.query ==='.bgGreen, req.query);

  try {
    const conn = await mysql.createConnection(dbConfig);
    let sql = 'SELECT * FROM posts';

    // if query params id
    if (req.query.id) {
      sql = 'SELECT * FROM posts WHERE id = ?';
      const [rows] = await conn.execute(sql, [req.query.id]);
      res.status(200).json(rows);
      conn.end();
      return;
    }

    // http://localhost:3000/api/articles?orderBy=author
    // isrikiuoti pagal gauta parametra
    // if query params limit
    if (req.query.orderBy) {
      sql += ` ORDER BY ${conn.escapeId(req.query.orderBy)}`;
    }
    // if query params limit
    if (req.query.limit) {
      sql += ` LIMIT ${conn.escape(+req.query.limit)}`;
    }

    console.log('sql ===', sql);
    const [rows] = await conn.query(sql);
    res.status(200).json(rows);
    conn.end();
  } catch (error) {
    console.log('error ', error);
    res.status(500).json({
      msg: 'Something went wrong',
    });
  }
});

// GET /api/articles?id=3 - grazina straipsni kurio id lygus 3

// GET /api/articles/2 - grazina straipsni kurio id lygus 2 (dinaminis routes)
app.get('/api/articles/:aId', async (req, res) => {
  const id = req.params.aId;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const sql = 'SELECT * FROM posts WHERE id = ?';
    const [rows] = await conn.execute(sql, [id]);
    res.status(200).json(rows[0]);
    conn.end();
  } catch (error) {
    console.log('error ', error);
    res.status(500).json({
      msg: 'Something went wrong',
    });
  }
});

// DELETE /api/articles/:aId
app.delete('/api/articles/:aId', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const sql = 'DELETE FROM posts WHERE id = ?';
    const [rows] = await conn.execute(sql, [req.params.aId]);
    if (rows.affectedRows === 1) {
      res.json({
        msg: 'deleted success',
      });
    } else {
      res.status(400).json({
        msg: 'nothing deleted',
      });
    }

    conn.end();
  } catch (error) {
    console.log('error ', error);
    res.status(500).json({
      msg: 'Something went wrong',
    });
  }
  // res.json({
  //   msg: `deleting article with id ${req.params.aId}`,
  // });
});

// 404 - returns json
app.use((req, res) => {
  res.status(404).json({
    msg: 'Page not found',
  });
});

async function testDbConnection() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query('SELECT 1');
    // console.log('rows ===', rows);
    console.log('Connected to MYSQL DB '.bgCyan.bold);
    conn.end();
  } catch (error) {
    console.log(`Error connecting to db ${error.message}`.bgRed.bold);
    // console.log('error ===', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('is Xammp running?'.yellow);
    }
  }
}

testDbConnection();

app.listen(port, () => console.log(`Server online on port ${port}`.bgYellow.bold));