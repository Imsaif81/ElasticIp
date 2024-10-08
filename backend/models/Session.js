const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);

const Session = sequelize.define('Session', {
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true  // Mark sessionId as the primary key
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
  timestamps: true,
  // Disable Sequelize's automatic addition of the `id` field:
  freezeTableName: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

sequelize.sync();

module.exports = Session;
