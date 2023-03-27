import { pool, app } from '../index';

app.get('/api/clients', async (req, res) => {
  try {
    console.log('getting to server');
    const { rows } = await pool.query('SELECT * FROM clients');
    console.log('inside server');
    console.log(rows);
    return res.json({ success: true, code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/clients', async (req, res) => {
  console.log(req.body);
  const { clientData } = req.body;
  console.log(clientData);
  const createClientQuery = `
    INSERT INTO clients(first_name, last_name, payment_method, text_ok, email_ok, num_sessions,
      num_cancels, cell, email, rate)
      values ('${clientData.firstName}', '${clientData.lastName}', '${clientData.paymentMethod}' ,'${clientData.textOK}', 
        '${clientData.emailOK}', '${clientData.numSessions}', '${clientData.numCancels}', '${clientData.cell}',
        '${clientData.email}', '${clientData.rate}')
    `;
  pool.query(createClientQuery, (err, result) => {
    if (err) {
      console.log('error');
      console.error(err);
    } else {
      console.log('Client created successfully');
      return res.json({ success: true, code: 200, data: result });
    }
  });
});
