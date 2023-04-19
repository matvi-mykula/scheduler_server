import express from 'express';
import { clientValidation, idValidation } from '../clientValidation.mjs';
var clientRouter = express.Router();
import { pool } from '../index.js';

///// get all clients
clientRouter.get('/', async (req, res) => {
  try {
    console.log('getting to server');
    const { rows } = await pool.query('SELECT * FROM clients');
    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

///create new client
clientRouter.post('/', async (req, res) => {
  if (clientValidation(req.body) === false) {
    return res.json({
      success: false,
      code: 400,
      data: 'Needs to pass body as Client object',
    });
  }
  const {
    first_name,
    last_name,
    payment_method,
    text_ok,
    email_ok,
    num_sessions,
    num_cancels,
    cell,
    email,
    rate,
  } = req.body;

  console.log(req.body);

  console.log(first_name);
  const createClientQuery = `
  INSERT INTO clients(first_name, last_name, payment_method, text_ok, email_ok, num_sessions,
    num_cancels, cell, email, rate)
    values ('${first_name}', '${last_name}', '${payment_method}' ,'${text_ok}',
      '${email_ok}', '${num_sessions}', '${num_cancels}', '${cell}',
      '${email}', '${rate}')
  `;
  pool.query(createClientQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Client created successfully');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});

/// get client by searching id
clientRouter.get(`/:id`, async (req, res) => {
  /////---- currently im validation 'numbers' but string params such as
  //// --- 'bad' i get a server error: column 'bad' does not exist
  console.log(req.params.id);
  if (idValidation(req.params.id) === false) {
    return res.json({
      success: false,
      code: 400,
      data: 'Needs to pass params as Client.id',
    });
  }
  console.log('search clients for client');
  console.log(req.params.id);
  const createSessionQuery = `SELECT * FROM clients 
  WHERE id = ${req.params.id}`;

  pool.query(createSessionQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      return result.rows.length
        ? res.json({ success: true, code: 200, data: result.rows[0] })
        : res.json({ sucess: false, code: 400, data: 'ID not found' });
    }
  });
});

export { clientRouter };