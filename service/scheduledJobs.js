import cron from 'node-cron';
import { pool } from '../index.js';

const checkEveryMinute = cron.schedule('* * * * *', () => {
  console.log('checking');
});

export { checkEveryMinute };
