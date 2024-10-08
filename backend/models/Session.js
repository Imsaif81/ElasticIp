// Import Sequelize and initialize the connection
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with your PostgreSQL credentials (we will update .env later)
const sequelize = new Sequelize(process.env.DATABASE_URL);

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
sequelize.sync();

module.exports = Session;
