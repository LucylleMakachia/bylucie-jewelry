import Joi from 'joi';

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string().min(6).required(),
});

export function validateRegister(req, res, next) {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ errors });
  }
  next();
}
