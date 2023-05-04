//// ----- twilio
import Twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();
import { updateSession } from '../services/sessionRouteService.js';

const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const twilioClient = new Twilio(accountSid, authToken);

import express from 'express';
var twilioRouter = express.Router();

twilioRouter.post('/', (req, res) => {
  console.log('server to send message');
  console.log(req.body);
  twilioClient.messages
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
const options = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};
const updateMessage = (client, session) => {
  const dateString = new Date(session.date_time).toLocaleString(
    'en-US',
    options
  );
  const message = `Hello ${client.first_name}. This text is notifying you that your session has been rescheduled to ${dateString}`;

  sendTwilioText(client.cell, message, false);
  return;
};

/// need to update session

const sessionCreateMessage = (client, session) => {
  const dateString = new Date(session.date_time).toLocaleString(
    'en-US',
    options
  );
  const message = `Hello ${client.first_name}, you have a session scheduled with Matthew on 
  ${dateString}. \n
  `; //add to google calendar link
  console.log({ message });
  console.log({ session });
  // sendTwilioText(client.cell, message, false, session);
  /// doesnt need to be updated
  /// ask in message for confirmation/cancel
  sendImmediateText(client.cell, message);
};

const sessionRemindMessage = (client, session) => {
  const dateString = new Date(session.date_time).toLocaleString(
    'en-US',
    options
  );
  try {
    const message = `!Reminder! ${client.first_name}, you have a session scheduled at ${dateString} at ${session.location}`;
    sendImmediateText(client.cell, message);
  } catch (err) {
    console.log(err);
  }

  session.reminder_sent = true;
  const update = updateSession(session);
  console.log('reminder sent and updated');
};

const sendImmediateText = async (number, msg) => {
  console.log('send immediate scheduling text');
  try {
    await twilioClient.messages.create({
      body: msg,
      from: '+18884922935',
      to: `+1${number}`,
    });
  } catch (err) {
    console.log(err);
  }
};

//// maybe this doesnt work bacause of account tier??
//// cannot get scheduled text to work
const sendTwilioText = async (number, msg, reminder, session) => {
  console.log('send twilio');
  console.log(number);
  console.log(reminder);
  let sendDate;
  if (reminder) {
    const sessionDate = new Date(session.date_time);
    sendDate = new Date(
      Date.UTC(
        sessionDate.getUTCFullYear(),
        sessionDate.getUTCMonth(),
        sessionDate.getUTCDate() - 1,
        sessionDate.getUTCHours(),
        sessionDate.getUTCMinutes(),
        sessionDate.getUTCSeconds()
      )
    ).toISOString();
  } else {
    const now = new Date();
    const in20 = new Date(now.getTime() + 20 * 60000);
    sendDate = in20.toISOString();
  }
  console.log({ sendDate });
  try {
    await twilioClient.messages
      .create({
        body: msg,
        messagingServiceSid: 'MG9792cf3bfd5ad3cb2595d7278adb2b77',
        // from: '+18884922935',
        to: `+1${number}`,
        sendAt: sendDate,
        scheduleType: 'fixed',
      })
      .then((message) => {
        console.log(message.sid);
      })
      .catch((err) => {
        console.log(err);
      });
    console.log('sent');
  } catch (err) {
    console.log('send twilio problem');
    console.log(err);
  }
};

//// need to have server be accessible publicly in order to receive messages
twilioRouter.post('/', (req, res) => {});

export { twilioRouter, sessionCreateMessage, sessionRemindMessage };
