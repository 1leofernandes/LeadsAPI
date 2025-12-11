const rateLimit = require('express-rate-limit');

// Rate limiting para webhooks
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto
  message: { error: 'Muitas requisições deste IP' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por 15 minutos
  message: { error: 'Muitas requisições da API' }
});

// Validar conteúdo JSON
const validateJSON = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next();
};

module.exports = {
  webhookLimiter,
  apiLimiter,
  validateJSON
};