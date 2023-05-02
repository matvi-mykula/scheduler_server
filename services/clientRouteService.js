import { pool } from '../index.js';

const searchClientByIdQuery = (id) => {
  return `SELECT * FROM clients 
    WHERE id = ${id}`;
};

const searchForClient = async (id) => {
  try {
    const createClientQuery = searchClientByIdQuery(id);
    const res = await pool.query(createClientQuery);

    return res.rows.length
      ? { success: true, code: 200, data: res.rows[0] }
      : { sucess: false, code: 400, data: 'ID not found' };
  } catch (err) {
    console.log(err);
    return { success: false, code: 500, data: 'pool/query error' };
  }
};

export { searchForClient };
