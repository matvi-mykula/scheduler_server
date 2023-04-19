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

export { twilioRouter, twilioClient };
