'use client';

import { Box, Text, useColorModeValue } from '@chakra-ui/react';

interface EventsEmptyStateProps {
  canCreate: boolean;
}

export function EventsEmptyState({ canCreate }: EventsEmptyStateProps) {
  const textColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box py={8} px={4} textAlign="center">
      <Text fontSize="sm" color={textColor}>
        {canCreate
          ? 'Nenhum evento neste dia. Selecione outra data ou crie um novo evento.'
          : 'Nenhum evento neste dia.'}
      </Text>
    </Box>
  );
}
