const express = require('express');
require('dotenv').config();
const Twilio = require('twilio');

const { Pool } = require('pg');
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
    console.log('inside server');
    console.log(rows);
    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/clients', async (req, res) => {
  console.log(req.body);
  const { clientData } = req.body;
  console.log(clientData);
  const createClientQuery = `
  INSERT INTO clients(first_name, last_name, payment_method, text_ok, email_ok, num_sessions,
    num_cancels, cell, email, rate)
    values ('${clientData.firstName}', '${clientData.lastName}', '${clientData.paymentMethod}' ,'${clientData.textOK}',
      '${clientData.emailOK}', '${clientData.numSessions}', '${clientData.numCancels}', '${clientData.cell}',
      '${clientData.email}', '${clientData.rate}')
  `;
  pool.query(createClientQuery, (err, result) => {
    if (err) {
      console.log('error');
      console.error(err);
    } else {
      console.log('Client created successfully');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});

//// session routes
app.get('/api/sessions', async (req, res) => {
  try {
    console.log('getting to server');
    const { rows } = await pool.query('SELECT * FROM sessions');
    console.log('inside server');
    console.log(rows);
    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/sessions', async (req, res) => {
  console.log(req.body);
  const { sessionData } = req.body;
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
