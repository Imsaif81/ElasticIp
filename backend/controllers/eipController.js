const { EC2Client, AllocateAddressCommand, ReleaseAddressCommand } = require('@aws-sdk/client-ec2');
const Session = require('../models/Session');

// Predefined IP ranges to compare with
const predefinedIPs = [
  '43.204.6', '43.204.10', '43.204.11', '43.204.16', 
  '43.204.17', '43.204.21', '43.205.28', '43.205.57', 
  '43.205.71', '43.205.190'
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Retry mechanism for releasing IP
const releaseIpWithRetry = async (ec2Client, allocationId, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to release IP (AllocationId: ${allocationId}), attempt ${i + 1}`);
      const releaseCommand = new ReleaseAddressCommand({ AllocationId: allocationId });
      await ec2Client.send(releaseCommand);
      console.log(`Successfully released IP (AllocationId: ${allocationId}) on attempt ${i + 1}`);
      return true; // Success
    } catch (error) {
      console.error(`Error releasing IP on attempt ${i + 1}: ${error.message}`);
      if (i === retries - 1) {
        throw new Error(`Failed to release IP after ${retries} attempts: ${error.message}`);
      }
      await delay(1000); // Delay between retries
    }
  }
};

const createEIPs = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, sessionId } = req.body;
    // Log the sessionId received from the frontend
    console.log(`Received session ID from frontend: ${sessionId}`);

    if (!accessKeyId || !secretAccessKey || !region) {
      console.error('Missing AWS credentials or region');
      return res.status(400).json({ error: "AWS credentials (accessKeyId, secretAccessKey) and region are required." });
    }
    if (!sessionId) {
      console.error('Missing session ID');
      return res.status(400).json({ error: "Custom session ID is required." });
    }

    console.log('Received AWS credentials and sessionId:', { accessKeyId, secretAccessKey, region, sessionId });

    let session = await Session.findOne({ where: { sessionId } });
    if (!session) {
      console.log(`Creating new session with sessionId: ${sessionId}`);
      session = await Session.create({
        sessionId, 
        createdIPs: [], 
        allocatedIPs: [], 
        releasedIPs: [], 
        batchSize: 5
      });
    } else {
      console.log(`Existing session found with sessionId: ${sessionId}`);
    }

    const ec2Client = new EC2Client({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });

    while (session.allocatedIPs.length < 5 && session.processRunning) {
      console.log(`Starting a new batch of IP allocations. Batch size: ${session.batchSize}`);

      for (let i = 0; i < session.batchSize; i++) {
        try {
          console.log('Allocating new IP...');
          const allocateCommand = new AllocateAddressCommand({});
          const allocateResponse = await ec2Client.send(allocateCommand);
          const ip = allocateResponse.PublicIp;
          const allocationId = allocateResponse.AllocationId;

          console.log(`Allocated IP: ${ip}, AllocationId: ${allocationId}`);

          if (session.createdIPs.includes(ip)) {
            console.log(`IP ${ip} already created in this session, skipping...`);
            continue;
          }
          session.createdIPs.push(ip);
          await session.save();  // Save session after IP creation

          const firstThreeOctets = ip.split('.').slice(0, 3).join('.');
          if (predefinedIPs.includes(firstThreeOctets)) {
            console.log(`IP ${ip} matched predefined range, allocating...`);
            session.allocatedIPs.push({ ip, allocationId });
          } else {
            console.log(`IP ${ip} did not match predefined range, releasing...`);
            await releaseIpWithRetry(ec2Client, allocationId);
            session.releasedIPs.push(ip);
            await delay(1000);  // 1-second delay after releasing the IP
            console.log(`IP ${ip} released successfully.`);
          }

          if (session.allocatedIPs.length >= 5) break;
        } catch (error) {
          console.error(`Error during IP allocation: ${error.stack || error.message}`);
          return res.status(500).json({ error: `Error allocating/releasing IP: ${error.message}` });
        }
      }

      session.batchSize = 5 - session.allocatedIPs.length;
      await session.save();  // Save session after each batch
      console.log(`Batch completed. Current allocated IPs: ${session.allocatedIPs.length}`);

      if (session.allocatedIPs.length < 5 && session.processRunning) {
        console.log(`Waiting 1 minute before the next batch.`);
        await delay(60000);  // 1-minute delay between batches
      }
    }

    await session.save();  
    console.log('IP allocation process complete');
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
