const SystemLog = require('../models/SystemLog');

const apiLogger = (req, res, next) => {
  const start = Date.now();
  
  //log when the response is finished
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start;
      
      
      if (req.originalUrl.includes('/api/health')) return;

      const logEntry = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime,
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || req.connection.remoteAddress,
        error: res.locals.errorMessage || null 
      };

      await SystemLog.create(logEntry);
    } catch (err) {
      console.error('Failed to write SystemLog:', err);
    }
  });

  next();
};

module.exports = apiLogger;
