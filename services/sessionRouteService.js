////
import { pool } from '../index.js';

////sort list of all the weeks session objects into {day:object[], day:object[]....}

/// by day of week
const sortWeeklySessions2 = (data) => {
  console.log({ data });
  const eventsByDayOfWeek = events.reduce((acc, event) => {
    const date = new Date(event.date_time);
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
    acc[dayOfWeek] = acc[dayOfWeek] || [];
    acc[dayOfWeek].push(event);
    return acc;
  }, {});
};

///by number of day 0 being today
const sortWeeklySessions = (events) => {
  const today = new Date().getDay();
  const eventsByDayOfWeek = [[], [], [], [], [], [], []];

  events.forEach((event) => {
    const dayOfWeek = new Date(event.date_time).getDay();
    eventsByDayOfWeek[dayOfWeek].push(event);
  });

  const finalDict = {};
  for (let i = today; i < 7; i++) {
    finalDict[i - today] = eventsByDayOfWeek[i];
  }
  for (let i = 0; i < today; i++) {
    finalDict[7 - today + i] = eventsByDayOfWeek[i];
  }

  return finalDict;
};

//// when its a new session passed in to be immidiatly updated it doesnt have an id....

const updateSessionQuery = (session) => {
  console.log({ session });
  const {
    id,
    client_id,
    location,
    date_time,
    confirmed,
    canceled,
    reminder_sent,
  } = session;
  const updateSessionQuery = `UPDATE sessions 
  SET location = '${location}',
  date_time = '${date_time.toISOString()}',
  confirmed = ${confirmed},
  canceled = ${canceled},
  reminder_sent = ${reminder_sent}
  WHERE id=${id}`;

  console.log({ updateSessionQuery });
  return updateSessionQuery;
};
const updateSession = async (newSession) => {
  try {
    const updateQuery = updateSessionQuery(newSession);
    const res = await pool.query(updateQuery);
    return { success: true, code: 200, data: res };
  } catch (err) {
    console.log(err);
    return { success: false, code: 500, data: 'update failed' };
  }
};

export { sortWeeklySessions, updateSessionQuery, updateSession };
