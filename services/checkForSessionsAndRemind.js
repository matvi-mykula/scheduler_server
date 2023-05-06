import cron from 'node-cron';
import { pool } from '../index.js';
import { sessionRemindMessage } from '../routes/twilioRouter.js';
import { searchForClientById } from './clientRouteService.js';

////get all sessions for tomorrow, send out reminders and update accordingly
const checkTomorrowSessions = cron.schedule('01 12 * * *', async () => {
  console.log('checking');

  const tomorrowsSessionsResponse = await getTomorrowsSessions();
  const tomorrowsSessions = tomorrowsSessionsResponse.data.rows;
  for (let i = 0; i < tomorrowsSessions.length; i++) {
    const client = await searchForClientById(tomorrowsSessions[i].client_id);
    console.log({ client });
    const msg = await sessionRemindMessage(client.data, tomorrowsSessions[i]); // this shoudl update also
  }

  console.log('should have printed rows');
});

const getTomorrowsSessions = async () => {
  try {
    const tomorrowsSessionsQuery = `SELECT * FROM sessions 
  WHERE date_time BETWEEN 
  DATE_TRUNC('day', CURRENT_DATE + INTERVAL '1' DAY) 
  AND 
  DATE_TRUNC('day', CURRENT_DATE + INTERVAL '2' DAY) - INTERVAL '1' SECOND;`;

    const result = await pool.query(tomorrowsSessionsQuery);
    return { success: true, code: 200, data: result };
  } catch (err) {
    console.log(err);
  }
};

export { checkTomorrowSessions };
