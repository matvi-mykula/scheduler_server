import cron from 'node-cron';
import { pool } from '../index.js';
import { searchForClientById } from './clientRouteService.js';

const getSessionsThatJustHappened = cron.schedule(
  '0 */30 7-19 * * *',
  async () => {
    console.log('checking for recent sessions');
    const tomorrowsSessionsResponse = await getRecentSessionQuery();

    if (tomorrowsSessionsResponse.success) {
      console.log('session happend');
      // get relevant client and add to number of sessions
      const clientUpdateResponse = updateSessionQuery(
        tomorrowsSessionsResponse.data.rows[0].client_id
      );
      if (clientUpdateResponse.success) {
        console.log('num sessions +1');
        return clientUpdateResponse;
      }
    }
  }
);

const getRecentSessionQuery = async () => {
  const sessionQuery = `SELECT *
    FROM sessions
    WHERE date_time >= CURRENT_TIMESTAMP - INTERVAL '35 minutes';
    `;
  try {
    const result = await pool.query(sessionQuery);
    return { success: true, code: 200, data: result };
  } catch (err) {
    console.log(err);
  }
};

const updateSessionQuery = async (id) => {
  const sessionQuery = `UPDATE clients
        SET num_sessions = num_sessions + 1
        WHERE id = ${id};`;
  try {
    const result = await pool.query(sessionQuery);
    return { success: true, code: 200, data: result };
  } catch (err) {
    console.log(err);
  }
};

export { getSessionsThatJustHappened };
