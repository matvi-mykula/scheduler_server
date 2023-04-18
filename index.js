import { clientValidation, idValidation } from './clientValidation.mjs';
import {
  postSessionValidation,
  getSessionByDateValidation,
  postSessionTimeWindowQuery,
} from './sessionValidation.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import Twilio from 'twilio';
import moment from 'moment';
import testRouter from './routes/testRouter.js';
import { clientRouter } from './routes/clientRouter.js';
import { sessionRouter } from './routes/sessionRouter.js';
import pkg from 'pg';
const { Pool } = pkg;
var cors = require('cors');

const app = express();
app.use(cors());
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

////-------- socket.io stuff ----------------------------------------
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
// const io = new Server(server);
const socketio = require('socket.io');
const io = socketio(server, { cors: {} });

/// maybe why this is logging so many times is that i am making requests every time DailySchedule
// component runs??? Should i make all the info calls in the Calendar component? and then
// just pass along dailySessionData info to the daily components?
io.on('connection', (socket) => {
  // console.log(`socket connected: ${socket.id}`);
  // console.log(socket.handshake.headers);
  // Listen for calendar update events
  socket.on('calendar:updated', () => {
    console.log('socket emit');
    // Emit the event to all connected clients
    io.emit('calendar:updated');
  });
});

/////-------

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

app.use('/api/test', testRouter);

app.use('/api/clients', clientRouter);
app.use('/api/sessions', sessionRouter);

//// ----- twilio
// const accountSid = process.env.ACCOUNTSID;
// const authToken = process.env.AUTHTOKEN;
// const client = new Twilio(accountSid, authToken);

// app.post('/sendMessage', (req, res) => {
//   console.log('server to send message');
//   console.log(req.body);
//   client.messages
//     .create({
//       body: req.body.msg,
//       from: '+18884922935',
//       to: req.body.number,
//     })
//     .then((message) => {
//       console.log('Message sent:', message.sid);
//     })
//     .catch((error) => {
//       console.log('Error sending message:', error);
//     });
// });

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
// // const createTableQuery = `
// CREATE TABLE sessions (
//   id SERIAL PRIMARY KEY,
//   client_id VARCHAR(50) NOT NULL,
//   location VARCHAR(50) NOT NULL,
//   date_time TIMESTAMPTZ NOT NULL,
//   confirmed BOOLEAN NOT NULL,
//   canceled BOOLEAN NOT NULL,
//   reminder_sent BOOLEAN NOT NULL
// )
// // `;

export { pool };
