import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

function StatusDisplay({ status }) {
  const getDynamicHeight = (arrayLength) => Math.min(arrayLength * 40, 200) + 'px';  // Dynamically adjust height based on number of IPs
  
  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="md" maxW="md" mx="auto" mt={8}>
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold" fontSize="lg" color="blue.600">
          Status of Elastic IPs:
        </Text>

        <Box maxH={getDynamicHeight(status.createdIPs.length)} overflowY="scroll" bg="gray.50" p={4} borderRadius="md" border="1px solid gray" style={{ scrollBehavior: 'smooth' }}>
          <Text fontWeight="bold" color="teal.500">Created IPs:</Text>
          {status.createdIPs.length > 0 ? status.createdIPs.map((ip, index) => (
            <Text key={index}>{ip}</Text>
          )) : <Text>No IPs Created Yet</Text>}
        </Box>

        <Box maxH={getDynamicHeight(status.allocatedIPs.length)} overflowY="scroll" bg="gray.50" p={4} borderRadius="md" border="1px solid green" style={{ scrollBehavior: 'smooth' }}>
          <Text fontWeight="bold" color="green.500">Allocated IPs:</Text>
          {status.allocatedIPs.length > 0 ? status.allocatedIPs.map((ipObj) => (
            <Text key={ipObj.allocationId}>{ipObj.ip}</Text>
          )) : <Text>No IPs Allocated Yet</Text>}
        </Box>

        <Box maxH={getDynamicHeight(status.releasedIPs.length)} overflowY="scroll" bg="gray.50" p={4} borderRadius="md" border="1px solid red" style={{ scrollBehavior: 'smooth' }}>
          <Text fontWeight="bold" color="red.500">Released IPs:</Text>
          {status.releasedIPs.length > 0 ? status.releasedIPs.map((ip, index) => (
            <Text key={index}>{ip}</Text>
          )) : <Text>No IPs Released Yet</Text>}
        </Box>
      </VStack>
    </Box>
  );
}

export default StatusDisplay;
