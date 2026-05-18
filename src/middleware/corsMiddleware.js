const cors = require('cors');

const allowedOrigins = [
  process.env.CORS_ORIGIN,          // e.g. http://localhost:5173 (Vite frontend)
  'http://localhost:5173',           // Vite local dev port
  'http://localhost:3000',           // fallback CRA / Next.js dev port
  'http://localhost:5000',           // same-origin self-calls if needed
].filter(Boolean);                   // strip undefined/null entries

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Check if the origin matches our fixed list or dynamic Netlify deploy previews/domains
    const isNetlifyMatch = origin === 'https://diagnosync.netlify.app' || 
                           origin === 'https://diagnosync.netlify.app/' ||
                           /^https:\/\/[a-zA-Z0-9-]+--diagnosync\.netlify\.app$/.test(origin);

    if (allowedOrigins.includes(origin) || isNetlifyMatch) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin "${origin}" is not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  credentials: true,          // allow cookies / Authorization header
  optionsSuccessStatus: 200   // some legacy browsers choke on 204
};

module.exports = cors(corsOptions);
