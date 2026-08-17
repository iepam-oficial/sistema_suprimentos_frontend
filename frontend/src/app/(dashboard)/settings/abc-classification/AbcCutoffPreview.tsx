'use client';

import { Box, HStack, Text, Tooltip, useColorModeValue } from '@chakra-ui/react';

type AbcCutoffPreviewProps = {
  cutoffA: number;
  cutoffB: number;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function AbcCutoffPreview({ cutoffA, cutoffB }: AbcCutoffPreviewProps) {
  const aEnd = clampPercent(cutoffA);
  const bEnd = Math.max(aEnd, clampPercent(cutoffB));
  const widthA = aEnd;
  const widthB = Math.max(0, bEnd - aEnd);
  const widthC = Math.max(0, 100 - bEnd);

  const trackBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2}>
        Faixas Pareto (preview)
      </Text>
      <HStack
        h="36px"
        w="100%"
        spacing={0}
        borderRadius="md"
        overflow="hidden"
        bg={trackBg}
        borderWidth="1px"
        borderColor={borderColor}
      >
        {widthA > 0 && (
          <Tooltip label={`Classe A: 0% → ${aEnd.toFixed(1)}%`} hasArrow>
            <Box
              h="100%"
              w={`${widthA}%`}
              bg="orange.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW={widthA >= 8 ? undefined : 0}
            >
              {widthA >= 10 && (
                <Text fontSize="xs" fontWeight="bold" color="white">
                  A
                </Text>
              )}
            </Box>
          </Tooltip>
        )}
        {widthB > 0 && (
          <Tooltip label={`Classe B: ${aEnd.toFixed(1)}% → ${bEnd.toFixed(1)}%`} hasArrow>
            <Box
              h="100%"
              w={`${widthB}%`}
              bg="yellow.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW={widthB >= 8 ? undefined : 0}
            >
              {widthB >= 10 && (
                <Text fontSize="xs" fontWeight="bold" color="blackAlpha.800">
                  B
                </Text>
              )}
            </Box>
          </Tooltip>
        )}
        {widthC > 0 && (
          <Tooltip label={`Classe C: ${bEnd.toFixed(1)}% → 100%`} hasArrow>
            <Box
              h="100%"
              w={`${widthC}%`}
              bg="gray.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW={widthC >= 8 ? undefined : 0}
            >
              {widthC >= 10 && (
                <Text fontSize="xs" fontWeight="bold" color="white">
                  C
                </Text>
              )}
            </Box>
          </Tooltip>
        )}
      </HStack>
      <HStack justify="space-between" mt={2} fontSize="xs" color={labelColor}>
        <Text>0%</Text>
        <Text>Corte A {aEnd.toFixed(1)}%</Text>
        <Text>Corte B {bEnd.toFixed(1)}%</Text>
        <Text>100%</Text>
      </HStack>
    </Box>
  );
}
