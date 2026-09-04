const validateSignupInput = (data) => {
  const errors = {};
  const { name, email, password } = data || {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Name is required";
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.email = "Valid email address is required";
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const validateLoginInput = (data) => {
  const errors = {};
  const { email, password } = data || {};

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.email = "Valid email address is required";
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    errors.password = "Password is required";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

module.exports = {
  validateSignupInput,
  validateLoginInput,
};
