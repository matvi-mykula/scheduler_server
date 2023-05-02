import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import moment from 'moment';
import { clientRouter } from './routes/clientRouter.js';
import { sessionRouter } from './routes/sessionRouter.js';
// import { twilioRouter } from './routes/twilioRouter.js';
import { checkEveryMinute } from './services/scheduledJobs.js';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';

const app = express();
app.use(cors());
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

////-------- socket.io stuff ----------------------------------------
import { createServer } from 'http';
const server = createServer(app);
import { Server } from 'socket.io';
import * as socketio from 'socket.io'; /// needed?
const io = new Server(server, { cors: {} });

/// should i emit same thing on post to all clients
//// when one client posts a new data row should that send calendar:updated to everyone??
io.on('connection', (socket) => {
  socket.on('calendar:updated', () => {
    console.log(socket.id);
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

app.use('/api/clients', clientRouter);
app.use('/api/sessions', sessionRouter);
// app.use('/api/sendMessage', twilioRouter);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
checkEveryMinute;

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
