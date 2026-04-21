function validateDeletePassword(req, res, next) {
  const password = req.headers['x-delete-password'];
  if (!password || password !== process.env.PASSWORD_DELETE) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  next();
}

module.exports = validateDeletePassword;
