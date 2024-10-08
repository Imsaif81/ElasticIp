const { EC2Client, AllocateAddressCommand, ReleaseAddressCommand } = require('@aws-sdk/client-ec2');
const Session = require('../models/Session');  // Sequelize Session model

// Predefined IP ranges to compare with
const predefinedIPs = [
  '43.204.6', '43.204.10', '43.204.11', '43.204.16', 
  '43.204.17', '43.204.21', '43.205.28', '43.205.57', 
  '43.205.71', '43.205.190'
];

// Create Elastic IPs and manage the allocation process
const createEIPs = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, sessionId } = req.body;

    // Ensure credentials, region, and sessionId are provided
    if (!accessKeyId || !secretAccessKey || !region) {
      console.error('Missing AWS credentials or region');
      return res.status(400).json({ error: "AWS credentials (accessKeyId, secretAccessKey) and region are required." });
    }
    if (!sessionId) {
      console.error('Missing session ID');
      return res.status(400).json({ error: "Custom session ID is required." });
    }

    // Log the sessionId received to ensure the correct custom session handling
    console.log('Received custom sessionId from frontend:', sessionId);

    // Fetch or create a new session for the user
    let session = await Session.findOne({ where: { sessionId } });
    if (!session) {
      console.log(`Creating new session with sessionId: ${sessionId}`);
      session = await Session.create({ sessionId, createdIPs: [], allocatedIPs: [], releasedIPs: [], batchSize: 5 });
    } else {
      console.log(`Existing session found with sessionId: ${sessionId}`);
    }

    const ec2Client = new EC2Client({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });

    // Allocate IPs until 5 valid IPs are found
    while (session.allocatedIPs.length < 5 && session.processRunning) {
      for (let i = 0; i < session.batchSize; i++) {
        try {
          const allocateCommand = new AllocateAddressCommand({});
          const allocateResponse = await ec2Client.send(allocateCommand);
          const ip = allocateResponse.PublicIp;
          const allocationId = allocateResponse.AllocationId;

          // Track created IPs in the PostgreSQL session to avoid duplication
          if (session.createdIPs.includes(ip)) {
            console.log(`IP ${ip} already created in this session, skipping...`);
            continue;
          }
          session.createdIPs.push(ip);

          // Compare the first three octets to predefined range
          const firstThreeOctets = ip.split('.').slice(0, 3).join('.');
          if (predefinedIPs.includes(firstThreeOctets)) {
            session.allocatedIPs.push({ ip, allocationId });
          } else {
            // Release IP if it doesn't match the predefined range
            const releaseCommand = new ReleaseAddressCommand({ AllocationId: allocationId });
            await ec2Client.send(releaseCommand);
            session.releasedIPs.push(ip);
          }

          if (session.allocatedIPs.length >= 5) break;
        } catch (error) {
          console.error(`Error during IP allocation: ${error.stack || error.message}`);
          return res.status(500).json({ error: `Error allocating/releasing IP: ${error.message}` });
        }
      }

      // Adjust batch size based on remaining IPs needed
      session.batchSize = 5 - session.allocatedIPs.length;
      await session.save();  // Save the session state after each batch

      // Wait for 1 minute between batches to avoid throttling
      if (session.allocatedIPs.length < 5 && session.processRunning) {
        console.log(`Waiting 1 minute before next batch. Allocated IPs: ${session.allocatedIPs.length}`);
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1-minute delay
      }
    }

    await session.save();  // Save the final session state

    // Send the result back to the frontend
    res.status(200).json({
      message: "IP allocation process complete",
      createdIPs: session.createdIPs,
      allocatedIPs: session.allocatedIPs,
      releasedIPs: session.releasedIPs
    });

  } catch (error) {
    console.error(`Error during the IP allocation process: ${error.stack || error.message}`);
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
    console.log(`IP allocation process stopped for session: ${sessionId}`);
    res.status(200).json({ message: "IP allocation process stopped for session: " + sessionId });
  } else {
    res.status(404).json({ error: "Session not found." });
  }
};

module.exports = { createEIPs, stopProcess };
