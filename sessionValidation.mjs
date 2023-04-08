const getSessionValidation = (requestBody) => {
  if (Object.keys(requestBody).length > 0) {
    return false;
  }
};

const getSessionByDateValidation = (parameters) => {
  if (!parameters) {
    return false;
  }
  if (!parameters.date) {
    return false;
  }
  //   if (typeof parameters.date != Date) {
  //     return false;
  //   }
};

export { getSessionValidation, getSessionByDateValidation };
