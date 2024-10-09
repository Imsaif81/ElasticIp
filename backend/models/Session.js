const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with your PostgreSQL database credentials directly
const sequelize = new Sequelize('elastic-ip-manager-db', 'ElasticIp', 'Mdsaif123', {
  host: 'elastic-ip-manager-db.cluster-clum0ygiqkzf.ap-south-1.rds.amazonaws.com',
  dialect: 'postgres',
  port: 5432,
  logging: false  // Disable logging for production
});

// Define the Session model using Sequelize
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true, // Automatically increments the id value for each new entry
    primaryKey: true     // Marks this as the primary key column
  },
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

sequelize.sync({ alter: true });

module.exports = Session;
