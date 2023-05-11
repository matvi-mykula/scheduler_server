import express from 'express';
var sessionRouter = express.Router();
import { pool } from '../index.js';
import {
  postSessionTimeWindowQuery,
  postSessionValidation,
} from '../sessionValidation.js';
import { sortWeeklySessions } from '../services/sessionRouteService.js';
import { sessionCreateMessage, sessionRemindMessage } from './twilioRouter.js';
import { updateSessionQuery } from '../services/sessionRouteService.js';
import { searchForClientById } from '../services/clientRouteService.js';
import { clientRouter } from './clientRouter.js';
import moment from 'moment';

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

/// get sessions by day with sockets

// get sessions by day
sessionRouter.get('/week', async (req, res) => {
  console.log('getting to /week');
  const weekStart = parseInt(req.query.weekStart);
  console.log(typeof weekStart);

  const now = moment().startOf('day');
  now.add(weekStart, 'weeks');

  try {
    const startOfWeek = now.toISOString();
    const endOfWeek = now.add(7, 'days').endOf('day').toISOString();
    const createSessionQuery = `SELECT * FROM sessions 
    WHERE date_time >= '${startOfWeek}'::timestamp
    AND date_time < '${endOfWeek}'::timestamp`;
    pool.query(createSessionQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        const weeklySessions = sortWeeklySessions(result.rows);
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
          pool.query(createSessionQuery, async (err, result) => {
            if (err) {
              console.log('error');
              console.log(err);
            } else {
              console.log('session created successfully');
              ///get client
              const res2 = await searchForClientById(client_id);
              const client = res2.data;
              console.log({ client });
              // send twilio msg
              const msg1 = sessionCreateMessage(client, newSession);
              /// should schedule the reminder here

              ///new session doesnt have id yet so update cant take place
              /// option 1 - get session by rest of data and use that
              // const msg2 = sessionRemindMessage(client, newSession);
              console.log('msg should send');
              return res.json({
                success: true,
                code: 200,
                data: result.rows,
              });
            }
          });
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

sessionRouter.delete('/', async (req, res) => {
  try {
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
  } catch (err) {
    console.log(err);
  }
});

sessionRouter.put('/', async (req, res) => {
  console.log('putting');
  try {
    console.log(req.body.sessionData);
    const updatedSession = req.body.sessionData;
    if (!postSessionValidation(updatedSession)) {
      return res.json({ success: false, code: 400, data: 'not valid session' });
    }
    const updateQuery = updateSessionQuery(updatedSession);
    pool.query(updateQuery, async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log('session updated');

        // always send text notifying that an update happened
        //get client info
        const clientByIDQuery = `SELECT * FROM clients 
WHERE id = ${updatedSession.client_id}`;

        pool.query(clientByIDQuery, async (err, result) => {
          if (err) {
            console.log(err);
          } else {
            const client = result.rows[0];
            // verify its ok to text client again here

            // const msg = updateMessage(client, updatedSession);

            //////----- commented out to save money

            return res.json({
              success: true,
              code: 200,
              data: `session ${updatedSession.id} updated`,
            });
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

export { sessionRouter };
