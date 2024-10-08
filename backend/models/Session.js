// Import Sequelize and initialize the connection
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with your PostgreSQL credentials from .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,  // Disable logging for cleaner console output (optional)
});

// Define the Session model using Sequelize
const Session = sequelize.define('Session', {
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  createdIPs: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  allocatedIPs: {
    type: DataTypes.ARRAY(DataTypes.JSON),
    defaultValue: []
  },
  releasedIPs: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  batchSize: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  processRunning: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Sync the model with the database (creates table if it doesn't exist)
sequelize.sync()
  .then(() => console.log('Session table has been successfully created (or already exists)'))
  .catch(err => console.error('Error syncing the Session model:', err));

module.exports = Session;
