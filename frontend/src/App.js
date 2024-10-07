import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, VStack, useToast } from '@chakra-ui/react';
import AwsForm from './components/AwsForm';
import StatusDisplay from './components/StatusDisplay';
import StopButton from './components/StopButton';
import theme from './theme';
import { v4 as uuidv4 } from 'uuid';  // Updated from uuidv4 to v4
import axios from 'axios';

function App() {
  // Generate a session ID when the component mounts (it will be unique per tab/user)
  const [sessionId] = useState(() => uuidv4());  // Using uuid v4 now
  const [status, setStatus] = useState({
    createdIPs: [],
    allocatedIPs: [],
    releasedIPs: []
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (creds) => {
    // Extract AWS credentials and region from creds
    const { accessKeyId, secretAccessKey, region } = creds;

    if (!accessKeyId || !secretAccessKey || !region) {
      toast({
        title: 'Missing Credentials',
        description: 'Please provide AWS Access Key, Secret Key, and Region.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Send the AWS credentials and sessionId to the backend
      const response = await axios.post('http://13.201.88.246:5000/create-eips', { accessKeyId, secretAccessKey, region, sessionId });

      setStatus(response.data);
      toast({
        title: 'IPs Created Successfully',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating IPs:', error.response ? error.response.data : error.message);  // Log exact error
      toast({
        title: 'Error Creating IPs',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Polling function to update status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://13.201.88.246:5000/status?sessionId=${sessionId}`);
        setStatus(response.data);
      } catch (error) {
        console.error('Error fetching status:', error.response ? error.response.data : error.message);  // Log exact error
      }
    }, 5000);

    return () => clearInterval(interval); // Clear interval when component unmounts
  }, [sessionId]);

  const handleStop = async () => {
    try {
      await axios.post('http://13.201.88.246:5000/stop-process', { sessionId });
      toast({
        title: 'Process Stopped',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error stopping process:', error.response ? error.response.data : error.message);  // Log exact error
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="gray.50" py={10}>
        <VStack spacing={6}>
          <AwsForm onSubmit={handleSubmit} loading={loading} />
          <StatusDisplay status={status} />
          <StopButton onStop={handleStop} />
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
