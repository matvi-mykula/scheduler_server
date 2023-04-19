import express from 'express';
var sessionRouter = express.Router();
import { pool } from '../index.js';
import {
  postSessionTimeWindowQuery,
  postSessionValidation,
} from '../sessionValidation.js';
import { sortWeeklySessions } from '../service/sessionRouteService.js';
import { twilioRouter, twilioClient } from './twilioRouter.js';

//// session routes

////rewrite using sockets

sessionRouter.get('/', async (req, res) => {
  try {
    console.log('getting from server');
    const { rows } = await pool.query('SELECT * FROM sessions');

    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
  }
});

// get sessions by day
sessionRouter.get('/week', async (req, res) => {
  console.log('getting to /week');
  try {
    const startOfWeek = new Date();
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    const createSessionQuery = `SELECT * FROM sessions 
    WHERE date_time >= '${startOfWeek.toISOString()}'::timestamp
    AND date_time < '${endOfWeek.toISOString()}'::timestamp`;
    pool.query(createSessionQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const weeklySessions = sortWeeklySessions(result.rows);
        console.log(weeklySessions);
        result.rows.length
          ? res.json({ success: true, code: 200, data: weeklySessions })
          : res.json({
              success: false,
              code: 400,
              data: 'no sessions on this week',
            });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

sessionRouter.post('/', async (req, res) => {
  console.log('posting');
  console.log(req.body);
  const newSession = req.body.sessionData;
  if (!postSessionValidation(newSession)) {
    return res.json({ success: false, code: 400, data: 'not valid session' });
  }
  const { client_id, location, date_time, confirmed, canceled, reminder_sent } =
    newSession;
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
          // const { client_id } = sessionData;

          const createSessionQuery = `INSERT INTO sessions(client_id, location, 
            date_time, confirmed, canceled, reminder_sent )
          values ('${client_id}', '${location}', 
          '${date_time}', '${confirmed}', 
          '${canceled}', '${reminder_sent}')`;
          console.log(createSessionQuery);
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
  }
});

sessionRouter.delete('/', async (req, res) => {
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

sessionRouter.put('/', async (req, res) => {
  console.log('putting');
  console.log(req.body.sessionData);
  const updatedSession = req.body.sessionData;
  if (!postSessionValidation(updatedSession)) {
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
  } = updatedSession;
  const createSessionQuery = `UPDATE sessions 
    SET location = '${location}',
    date_time = '${date_time}',
    confirmed = ${confirmed},
    canceled = ${canceled},
    reminder_sent = ${reminder_sent}
    WHERE id=${id}`;
  pool.query(createSessionQuery, async (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('session updated');

      // always send text notifying that an update happened
      //get client info
      const createSessionQuery = `SELECT * FROM clients 
WHERE id = ${client_id}`;

      pool.query(createSessionQuery, async (err, result) => {
        if (err) {
          console.log(err);
        } else {
          const client = result.rows[0];
          // verify its ok to text client again here
          const options = {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          };
          const dateString = new Date(date_time).toLocaleString(
            'en-US',
            options
          );
          //////----- commented out to save money
          // const message = await twilioClient.messages.create({
          //   body: `Hello ${client.first_name}. This text is notifying you that your session has been rescheduled to ${dateString}`,
          //   to: client.cell,
          //   from: +18884922935,
          // });

          return res.json({
            success: true,
            code: 200,
            data: `session ${id} updated`,
          });
        }
      });
    }
  });
});

export { sessionRouter };
