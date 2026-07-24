'use client';

import { Box, Text, useColorMode } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface ReportChartCardProps {
  title?: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
}

export function ReportChartCard({ title, subtitle, hint, children }: ReportChartCardProps) {
  const { colorMode } = useColorMode();
  const borderClr = colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const bg = colorMode === 'dark' ? 'rgba(45,55,72,0.4)' : 'rgba(255,255,255,0.6)';

  return (
    <Box p={4} rounded="lg" border="1px solid" borderColor={borderClr} bg={bg}>
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
