//// ----- twilio
import Twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

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

  sendTwilioText(client.cell, message);
  return;
};

const sessionCreateMessage = (client, session) => {
  const dateString = new Date(session.date_time).toLocaleString(
    'en-US',
    options
  );
  const message = `Hello ${client.first_name}, you have a session scheduled with Matthew on 
  ${datestring}. \n
  `; //add to google calendar link
  sendTwilioText(client.cell, message);
  //sent emit to update nofitification status
  return;
};

const sendTwilioText = async (number, msg) => {
  try {
    await twilioClient.messages.create({
      body: msg,
      from: '+18884922935',
      to: number,
    });
    console.log('sent');
  } catch (err) {
    console.log('send twilio problem');
    console.log(err);
  }
};

export { sessionCreateMessage, updateMessage };
