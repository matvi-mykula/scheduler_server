import moment from 'moment';
const postSessionValidation = (session) => {
  console.log(session);
  if (Object.keys(session).length === 0) {
    console.log('no keys');
    return false;
  }
  // Check that the required properties are present
  if (!session.client_id || !session.location || !session.date_time) {
    console.log('required properties');
    return false;
  }

  // Check that the types of the properties are correct
  if (
    typeof session.client_id !== 'string' ||
    typeof session.reminder_sent !== 'boolean' ||
    typeof session.confirmed !== 'boolean' ||
    typeof session.canceled !== 'boolean' ||
    typeof session.location !== 'string' ||
    !moment(session.date_time, moment.ISO_8601, true).isValid()
  ) {
    console.log('wrong type');
    return false;
  }

  return true;
};
const postSessionTimeWindowQuery = (time) => {
  const timeWindowBefore = new Date(
    new Date(Date.parse(time) - 75 * 60000).toUTCString()
  );
  const timeWindowAfter = new Date(
    new Date(Date.parse(time) + 75 * 60000).toUTCString()
  );

  const timeValidationQuery = `SELECT date_time FROM sessions 
  WHERE date_time = '${time}' 
    OR date_time BETWEEN 
    '${timeWindowBefore.toISOString()}' AND 
    '${timeWindowAfter.toISOString()}'`;
  return timeValidationQuery;
};
const getSessionByDateValidation = (parameters) => {
  if (!parameters) {
    return false;
  }
  if (!parameters.date) {
    return false;
  }
  return moment(parameters.date, moment.ISO_8601, true).isValid();

  //   if (typeof parameters.date != Date) {
  //     return false;
  //   }
};

export {
  postSessionValidation,
  getSessionByDateValidation,
  postSessionTimeWindowQuery,
};
