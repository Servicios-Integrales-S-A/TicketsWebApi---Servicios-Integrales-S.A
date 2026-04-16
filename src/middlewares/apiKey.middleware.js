require('dotenv').config();

const verificarApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ mensaje: 'API Key requerida.' });
  }

  if (apiKey !== process.env.INTEGRATION_API_KEY) {
    return res.status(403).json({ mensaje: 'API Key inválida.' });
  }

  next();
};

module.exports = { verificarApiKey };
