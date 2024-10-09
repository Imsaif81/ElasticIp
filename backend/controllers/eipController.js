const { EC2Client, AllocateAddressCommand, ReleaseAddressCommand } = require('@aws-sdk/client-ec2');
const Session = require('../models/Session');  // Custom Session model for tracking IP allocations

// Predefined IP ranges to compare with
const predefinedIPs = [
  '43.204.6', '43.204.10', '43.204.11', '43.204.16', 
  '43.204.17', '43.204.21', '43.205.28', '43.205.57', 
  '43.205.71', '43.205.190'
];

// Helper function to introduce a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Create Elastic IPs and manage the allocation process
const createEIPs = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, sessionId } = req.body;

    if (!accessKeyId || !secretAccessKey || !region) {
      console.error('Missing AWS credentials or region');
      return res.status(400).json({ error: "AWS credentials (accessKeyId, secretAccessKey) and region are required." });
    }
    if (!sessionId) {
      console.error('Missing session ID');
      return res.status(400).json({ error: "Custom session ID is required." });
    }

    let session = await Session.findOne({ where: { sessionId } });
    if (!session) {
      session = await Session.create({
        sessionId, 
        createdIPs: [], 
        allocatedIPs: [], 
        releasedIPs: [], 
        batchSize: 5
      });
    }

    const ec2Client = new EC2Client({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });

    while (session.allocatedIPs.length < 5 && session.processRunning) {
      for (let i = 0; i < session.batchSize; i++) {
        try {
          const allocateCommand = new AllocateAddressCommand({});
          const allocateResponse = await ec2Client.send(allocateCommand);
          const ip = allocateResponse.PublicIp;
          const allocationId = allocateResponse.AllocationId;

          if (session.createdIPs.includes(ip)) {
            continue;
          }
          session.createdIPs.push(ip);

          const firstThreeOctets = ip.split('.').slice(0, 3).join('.');
          if (predefinedIPs.includes(firstThreeOctets)) {
            session.allocatedIPs.push({ ip, allocationId });
          } else {
            const releaseCommand = new ReleaseAddressCommand({ AllocationId: allocationId });
            await ec2Client.send(releaseCommand);  
            session.releasedIPs.push(ip);
            await delay(1000);  // 1-second delay after releasing the IP
          }

          if (session.allocatedIPs.length >= 5) break;
        } catch (error) {
          return res.status(500).json({ error: `Error allocating/releasing IP: ${error.message}` });
        }
      }

      session.batchSize = 5 - session.allocatedIPs.length;
      await session.save();  

      if (session.allocatedIPs.length < 5 && session.processRunning) {
        await new Promise(resolve => setTimeout(resolve, 60000));  
      }
    }

    await session.save();  
    res.status(200).json({
      message: "IP allocation process complete",
      createdIPs: session.createdIPs,
      allocatedIPs: session.allocatedIPs,
      releasedIPs: session.releasedIPs
    });

  } catch (error) {
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// Stop the process for a specific session
const stopProcess = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Custom session ID is required to stop the process." });
  }

  let session = await Session.findOne({ where: { sessionId } });
  if (session) {
    session.processRunning = false;
    await session.save();
    res.status(200).json({ message: "IP allocation process stopped for session: " + sessionId });
  } else {
    res.status(404).json({ error: "Session not found." });
  }
};

// Export both functions
module.exports = { createEIPs, stopProcess };
