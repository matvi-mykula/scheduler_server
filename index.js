import { clientValidation, idValidation } from './clientValidation.mjs';
import {
  getSessionValidation,
  getSessionByDateValidation,
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
  /////////-------- why is postman recognizing a req.body and not a param????
  // if (req.body) {
  //   return res.json({
  //     success: false,
  //     code: 400,
  //     data: 'Only takes param',
  //   });
  // }
  if (idValidation(req.params.id) === false) {
    return res.json({
      success: false,
      code: 400,
      data: 'Needs to pass body as Client object',
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
      console.log('client retrieved');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});

//// session routes
app.get('/api/sessions', async (req, res) => {
  if (getSessionValidation(req.body) === false) {
    return res.json({
      success: false,
      code: 400,
      data: 'Cannot have any request body',
    });
  }
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
  if (
    getSessionByDateValidation(req.params) === false ||
    getSessionValidation(req.body) === false
  ) {
    return res.json({
      success: false,
      code: 400,
      data: 'Not a valid Date parameter',
    });
  }

  const createSessionQuery = `SELECT * FROM sessions 
 WHERE DATE(date_time) = DATE('${req.params.date}')`;

  pool.query(createSessionQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('day schedule retrieved');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});

app.post('/api/sessions', async (req, res) => {
  // await validateRequest(req.body)
  const { sessionData } = req.body;
  console.log(sessionData.date_time);
  try {
    const timeWindowBefore = new Date(
      new Date(Date.parse(sessionData.date_time) - 75 * 60000).toUTCString()
    );
    const timeWindowAfter = new Date(
      new Date(Date.parse(sessionData.date_time) + 75 * 60000).toUTCString()
    );

    const timeValidationQuery = `SELECT date_time FROM sessions 
    WHERE date_time = '${sessionData.date_time}' 
      OR date_time BETWEEN 
      '${timeWindowBefore.toISOString()}' AND 
      '${timeWindowAfter.toISOString()}'`;

    const existingRecord = await pool.query(
      timeValidationQuery,
      //// checks if there is already a scheduled appt with in 75 minutes
      //     before and after date_time value of this session
      (err, result) => {
        if (result && result.rows && result.rows.length > 0) {
          console.log('rejected because of time overlap');
          return res.json({
            success: false,
            code: 400,
            data: result,
          });
          // res.status(400).send('Duplicate date_time value'); // Return an error message to the client
        } else {
          // If there are no rows returned, that means the value are unique
          const { client_id } = sessionData;

          const createSessionQuery = `INSERT INTO sessions(client_id, location, 
          date_time, confirmed, canceled, reminder_sent )
        values ('${sessionData.client_id}', '${sessionData.location}', 
        '${sessionData.date_time}', '${sessionData.confirmed}', 
        '${sessionData.canceled}', '${sessionData.reminder_sent}')`;
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
  console.log('delete');
  console.log(req.body);
  createSessionQuery = `DELETE FROM sessions WHERE id = ${req.body.id}`;
  pool.query(createSessionQuery, (err, result) => {
    if (err) {
      console.log('error');
      console.log(err);
    } else {
      console.log('session row removed');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});

app.put('/api/sessions', async (req, res) => {
  console.log('update');
  console.log(req.body);
  const {
    id,
    client_id,
    location,
    date_time,
    confirmed,
    canceled,
    reminder_sent,
  } = req.body.data;
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
      console.log({ result });
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
const createTableQuery = `
  CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    location VARCHAR(50) NOT NULL,
    date_time VARCHAR(50) NOT NULL,
    confirmed BOOLEAN NOT NULL,
    canceled BOOLEAN NOT NULL,
    reminder_sent BOOLEAN NOT NULL
  )
`;

// console.log('hey2');

// pool.query(createTableQuery, (err, res) => {
//   if (err) {
//     console.log('error');
//     console.error(err);
//   } else {
//     console.log('Table created successfully');
//   }
// });
// console.log('hey3');

// import axios from 'axios';
// import { Identifier } from 'typescript';
// ///send blog data to database
// function figureAPI() {
//   console.log(window.location);
//   console.log(process.env.NODE_ENV);
//   const devBackend = 'http://localhost:3001/';
//   const prodBackend = 'https://dry-silence-9236.fly.dev/';

//   console.log({ prodBackend });
//   const prodEnv = process.env.NODE_ENV === 'production';
//   console.log(prodEnv);
//   let environment;
//   prodEnv ? (environment = prodBackend) : (environment = devBackend);
//   return environment;
// }

// const environment = figureAPI();

// interface User {
//   id: Identifier;
//   firstName: string;
//   lastName: string;
//   paymentMethod: 'credit' | 'cash' | 'venmo' | 'other';
//   textOK: boolean;
//   numSessions: number;
//   numCancel: number;
// }

// const getUsers = () => {
//     console.log('getting user data')
// }

// const postUser = (userData: User) => {
//   console.log('posting blog post');
//   axios
//     .post(environment + 'postUser', {
//       userData,
//     })
//     .then((response) => {
//       console.log('this blog post should be posted');

//       console.log(response.data);
//     });
// };

// export { postUser };
