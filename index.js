import { clientValidation, idValidation } from './clientValidation.mjs';
import {
  postSessionValidation,
  getSessionByDateValidation,
  postSessionTimeWindowQuery,
} from './sessionValidation.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import Twilio from 'twilio';

import pkg from 'pg';
const { Pool } = pkg;
var cors = require('cors');

const app = express();
app.use(cors());
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
pool.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('connected to db');
  }
});

// export { pool, app };
// API routes
// interface APIResponse {
//   success: boolean;
//   code: number;
//   data: any;
// }

app.get('/api/clients', async (req, res) => {
  try {
    console.log('getting to server');
    const { rows } = await pool.query('SELECT * FROM clients');
    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/clients', async (req, res) => {
  if (clientValidation(req.body) === false) {
    return res.json({
      success: false,
      code: 400,
      data: 'Needs to pass body as Client object',
    });
  }
  const {
    first_name,
    last_name,
    payment_method,
    text_ok,
    email_ok,
    num_sessions,
    num_cancels,
    cell,
    email,
    rate,
  } = req.body;

  console.log(req.body);

  console.log(first_name);
  const createClientQuery = `
  INSERT INTO clients(first_name, last_name, payment_method, text_ok, email_ok, num_sessions,
    num_cancels, cell, email, rate)
    values ('${first_name}', '${last_name}', '${payment_method}' ,'${text_ok}',
      '${email_ok}', '${num_sessions}', '${num_cancels}', '${cell}',
      '${email}', '${rate}')
  `;
  pool.query(createClientQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Client created successfully');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});
app.get(`/api/client/:id`, async (req, res) => {
  /////---- currently im validation 'numbers' but string params such as
  //// --- 'bad' i get a server error: column 'bad' does not exist
  console.log(req.params.id);
  if (idValidation(req.params.id) === false) {
    return res.json({
      success: false,
      code: 400,
      data: 'Needs to pass params as Client.id',
    });
  }
  console.log('search clients for client');
  console.log(req.params.id);
  const createSessionQuery = `SELECT * FROM clients 
  WHERE id = ${req.params.id}`;

  pool.query(createSessionQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      return result.rows.length
        ? res.json({ success: true, code: 200, data: result.rows })
        : res.json({ sucess: false, code: 400, data: 'ID not found' });
    }
  });
});

//// session routes
app.get('/api/sessions', async (req, res) => {
  // if (getSessionValidation(req.body) === false) {
  //   return res.json({
  //     success: false,
  //     code: 400,
  //     data: 'Cannot have any request body',
  //   });
  // }
  try {
    console.log('getting from server');
    const { rows } = await pool.query('SELECT * FROM sessions');

    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
  }
});

// get sessions by day
app.get('/api/sessions/day/:date', async (req, res) => {
  console.log(req.params);
  if (
    getSessionByDateValidation(req.params) === false
    // gSessionValidation(req.body) === false
  ) {
    return res.json({
      success: false,
      code: 400,
      data: 'Not a valid Date parameter',
    });
  }
  console.log(req.params.date.date);
  const createSessionQuery = `SELECT * FROM sessions 
 WHERE DATE(date_time) = DATE('${req.params.date}')`;
  //// maybe it has to do with the format of params.date
  pool.query(createSessionQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('day schedule retrieved');
      result.rows.length
        ? res.json({ success: true, code: 200, data: result.rows })
        : res.json({
            success: false,
            code: 400,
            data: 'no sessions on this day',
          });
    }
  });
});

app.post('/api/sessions', async (req, res) => {
  // await validateRequest(req.body)
  if (!postSessionValidation(req.body)) {
    return res.json({ success: false, code: 400, data: 'not valid session' });
  }
  const {
    id,
    client_id,
    location,
    date_time,
    confirmed,
    canceled,
    reminder_sent,
  } = req.body;
  console.log({ id });
  try {
    const existingRecord = await pool.query(
      postSessionTimeWindowQuery(date_time),
      //// checks if there is already a scheduled appt with in 75 minutes
      //     before and after date_time value of this session
      (err, result) => {
        if (result && result.rows && result.rows.length > 0) {
          console.log('rejected because of time overlap');
          return res.json({
            success: false,
            code: 400,
            data: `rejected because of overlap with another session`,
          });
          // res.status(400).send('Duplicate date_time value'); // Return an error message to the client
        } else {
          // If there are no rows returned, that means the value are unique
          const { client_id } = sessionData;

          const createSessionQuery = `INSERT INTO sessions(client_id, location, 
          date_time, confirmed, canceled, reminder_sent )
        values ('${client_id}', '${location}', 
        '${date_time}', '${confirmed}', 
        '${canceled}', '${reminder_sent}')`;
          pool.query(createSessionQuery, (err, result) => {
            if (err) {
              console.log('error');
              console.log(err);
            } else {
              console.log('session created successfully');
              return res.json({ success: true, code: 200, data: result.rows });
            }
          });
        }
      }
    );
  } catch (e) {
    console.log(e);
    console.error;
  }
});

app.delete('/api/sessions', async (req, res) => {
  if (isNaN(Number(req.body.id))) {
    /// how to check if req.body.id is an integer???
    return res.json({
      success: false,
      code: 400,
      data: 'session id not valid',
    });
  }

  const checkDeleteQuery = `SELECT FROM sessions WHERE id = ${req.body.id}`;
  pool.query(checkDeleteQuery, (err, result) => {
    if (err) {
      //   return res.json({
      //     success: false,
      //     code: 400,
      //     data: 'session not found for deletion',
      //   });
    }
    if (result) {
      if (result.rows.length === 0) {
        return res.json({
          success: false,
          code: 400,
          data: 'session not found for deletion',
        });
      } else {
        console.log('delete');
        console.log(req.body);
        const createSessionQuery = `DELETE FROM sessions WHERE id = ${req.body.id}`;
        pool.query(createSessionQuery, (err, result) => {
          if (err) {
            console.log('error');
            console.log(err);
          } else {
            console.log('session row removed');
            return res.json({ success: true, code: 200, data: result });
          }
        });
      }
    }
  });
});

app.put('/api/sessions', async (req, res) => {
  if (!postSessionValidation(req.body)) {
    return res.json({ success: false, code: 400, data: 'not valid session' });
  }

  const {
    id,
    client_id,
    location,
    date_time,
    confirmed,
    canceled,
    reminder_sent,
  } = req.body;
  const createSessionQuery = `UPDATE sessions 
  SET location = '${location}',
  date_time = '${date_time}',
  confirmed = ${confirmed},
  canceled = ${canceled},
  reminder_sent = ${reminder_sent}
  WHERE id=${id}`;
  pool.query(createSessionQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('session updated');
      console.log(result);
      return res.json({ success: true, code: 200, data: result });
    }
  });
});

//// ----- twilio
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const client = new Twilio(accountSid, authToken);

app.post('/sendMessage', (req, res) => {
  console.log('server to send message');
  console.log(req.body);
  client.messages
    .create({
      body: req.body.msg,
      from: '+18884922935',
      to: req.body.number,
    })
    .then((message) => {
      console.log('Message sent:', message.sid);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

///// ------- set up tables
// const createTableQuery = `
//   CREATE TABLE clients (
//     id SERIAL PRIMARY KEY,
//     first_name VARCHAR(50) NOT NULL,
//     last_name VARCHAR(50) NOT NULL,
//     payment_method VARCHAR(10) NOT NULL,
//     text_ok BOOLEAN NOT NULL,
//     email_ok BOOLEAN NOT NULL,
//     num_sessions INTEGER NOT NULL,
//     num_cancels INTEGER NOT NULL,
//     cell VARCHAR(50) NOT NULL,
//     email VARCHAR(50) NOT NULL,
//     rate INTEGER NOT NULL
//   )
// `;
// const createTableQuery = `
//   CREATE TABLE sessions (
//     id SERIAL PRIMARY KEY,
//     client_id VARCHAR(50) NOT NULL,
//     location VARCHAR(50) NOT NULL,
//     date_time VARCHAR(50) NOT NULL,
//     confirmed BOOLEAN NOT NULL,
//     canceled BOOLEAN NOT NULL,
//     reminder_sent BOOLEAN NOT NULL
//   )
// `;
