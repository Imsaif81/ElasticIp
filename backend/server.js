require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cors = require('cors');
const eipController = require('./controllers/eipController');  // Your controller
const { Sequelize } = require('sequelize');
const path = require('path');
const Session = require('./models/Session');  // Import the Session model correctly
// Import Sequelize instance
const { sequelize } = require('./models/Session');  // Import sequelize from your model





(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(express.json());

// CORS Setup
app.use(cors({
  origin: 'http://3.110.156.144',  // Your frontend domain
  credentials: true,  // Allows credentials (cookies, etc.)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Configure a different session table for express-session
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'ExpressSessions' // Use a different table name
});

// Session middleware
app.use(session({
  secret: 'secretKey',  // Secure key for signing the session ID cookie
  resave: false,        // Don't save session if unmodified
  saveUninitialized: true,  // Save uninitialized sessions
  store: sessionStore,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }  // Session expiry set to 1 day
}));

sessionStore.sync();  // Sync session store

// Routes for creating and stopping Elastic IP operations
app.post('/create-eips', eipController.createEIPs);
app.post('/stop-process', eipController.stopProcess);

// Route to fetch the status of the current session
app.get('/status', async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required in the query parameter." });
  }

  try {
    // Fetch session using sessionId (correct column)
    const session = await Session.findOne({ where: { sessionId } });

    if (!session) {
      return res.status(404).json({ error: `No session found for Session ID: ${sessionId}` });
    }

    // Return the session-specific status (created, allocated, and released IPs)
    res.status(200).json({
      createdIPs: session.createdIPs,
      allocatedIPs: session.allocatedIPs,
      releasedIPs: session.releasedIPs
    });
  } catch (error) {
    console.error(`Error fetching session data: ${error.message}`);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// Serve frontend (if applicable)
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = sequelize;
