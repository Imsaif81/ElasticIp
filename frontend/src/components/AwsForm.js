import React, { useState } from 'react';
import { VStack, Input, Button, Select, Heading, Box, useToast } from '@chakra-ui/react';

function AwsForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'ap-south-1',  // Default region set to Asia Pacific (Mumbai)
  });

  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation to ensure all fields are filled
    if (!formData.accessKeyId || !formData.secretAccessKey || !formData.region) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="md" maxW="md" mx="auto" mt={8}>
      <Heading as="h2" size="lg" textAlign="center" mb={6} color="brand.900">
        AWS Elastic IP Management
      </Heading>
      <VStack as="form" spacing={4} onSubmit={handleSubmit}>
        <Input
          name="accessKeyId"
          placeholder="AWS Access Key ID"
          value={formData.accessKeyId}
          onChange={handleChange}
        />
        <Input
          name="secretAccessKey"
          type="password"
          placeholder="AWS Secret Access Key"
          value={formData.secretAccessKey}
          onChange={handleChange}
        />
        <Select name="region" value={formData.region} onChange={handleChange}>
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="eu-west-1">EU (Ireland)</option>
          <option value="ap-south-1">Asia Pacific (Mumbai)</option>
          <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
          <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          <option value="sa-east-1">South America (São Paulo)</option>
        </Select>
        <Button colorScheme="teal" type="submit" isLoading={loading} width="full">
          Start IP Allocation
        </Button>
      </VStack>
    </Box>
  );
}

export default AwsForm;
