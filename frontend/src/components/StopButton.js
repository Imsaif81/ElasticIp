import React from 'react';
import { Button } from '@chakra-ui/react';

function StopButton({ onStop, isStopping }) {
  return (
    <Button
      colorScheme="red"
      onClick={onStop}
      isLoading={isStopping}  // Shows a spinner when stopping
      isDisabled={isStopping}  // Disables the button when stopping
    >
      Stop Process
    </Button>
  );
}

export default StopButton;
