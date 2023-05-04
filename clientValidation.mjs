const clientValidation = (client) => {
  const isValid =
    // typeof client.id === 'string' &&  //  not here yet
    typeof client.first_name === 'string' &&
    typeof client.last_name === 'string' &&
    ['credit', 'cash', 'venmo', 'other'].includes(client.payment_method) &&
    typeof client.text_ok === 'boolean' &&
    typeof client.email_ok === 'boolean' &&
    typeof client.num_sessions === 'number' &&
    typeof client.num_cancels === 'number' && /// dont need these cause they will be initialized to zero
    typeof client.rate === 'number' &&
    typeof client.email === 'string' &&
    typeof client.cell === 'string';

  return isValid;
};
const idValidation = (id) => {
  return typeof id === 'string' && typeof parseInt(id) === 'number';
};

// interface Client {
//   id: string;
//   first_name: string;
//   last_name: string;
//   payment_method: 'credit' | 'cash' | 'venmo' | 'other';
//   text_ok: boolean;
//   email_ok: boolean;
//   num_sessions: number;
//   num_cancels: number;
//   // add more
//   rate: number;
//   email: string;
//   cell: string;
//   [key: string]: string | boolean | number | undefined;
// }

export { clientValidation, idValidation };
