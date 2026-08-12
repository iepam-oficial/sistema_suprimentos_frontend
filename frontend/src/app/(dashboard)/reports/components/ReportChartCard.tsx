'use client';

import { Box, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface ReportChartCardProps {
  title?: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
}

export function ReportChartCard({ title, subtitle, hint, children }: ReportChartCardProps) {
  return (
    <Box>
      {title && (
        <Text fontSize="sm" fontWeight="semibold" mb={subtitle || hint ? 1 : 3}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text fontSize="xs" color="gray.500" mb={hint ? 1 : 3}>
          {subtitle}
        </Text>
      )}
      {hint && (
        <Text fontSize="xs" color="blue.400" mb={3} fontStyle="italic">
          {hint}
        </Text>
      )}
      {children}
    </Box>
  );
}
