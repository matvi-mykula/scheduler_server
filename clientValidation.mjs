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

export { clientValidation, idValidation };

export const validateResquest = (validationSchema, body) => {};
