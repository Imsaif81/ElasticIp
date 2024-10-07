require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const eipController = require('./controllers/eipController');  // Your controller
const Session = require('./models/Session');  // Import Session model

const app = express();
const PORT = process.env.PORT || 5000;

// Check for MONGO_URI
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in the environment variables.');
  process.exit(1);  // Exit the app if no MongoDB connection string is found
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000  // Timeout for connection issues
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware setup
app.use(express.json());

// CORS Setup
app.use(cors({
  origin: ['http://13.201.88.246'],  // Replace with your frontend domain
  credentials: true  // Allows credentials (cookies, etc.)
}));

app.use(session({
  secret: 'secretKey',  // Secure key for signing the session ID cookie
  resave: false,        // Don't save session if unmodified
  saveUninitialized: true,  // Save uninitialized sessions
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,  // MongoDB connection string
    collectionName: 'sessions'        // Collection where sessions will be stored
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 }  // Session expiry set to 1 day
}));

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
    // Fetch the session data from MongoDB based on the sessionId
    const session = await Session.findOne({ sessionId });

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

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
