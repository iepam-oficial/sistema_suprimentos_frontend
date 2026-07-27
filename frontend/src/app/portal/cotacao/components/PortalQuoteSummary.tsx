'use client';

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  HStack,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import type { PortalQuoteInviteContextDTO } from '@ti-assistant/contracts';
import { useGlassTokens } from '@/components/layout';
import {
  formatDate,
  getWorkflowStepIndex,
  WORKFLOW_STEPS,
} from './portalQuoteUtils';

interface PortalQuoteSummaryProps {
  context: PortalQuoteInviteContextDTO;
}

function SummaryContent({ context }: PortalQuoteSummaryProps) {
  const { mutedColor, headingColor } = useGlassTokens();
  const activeStep = getWorkflowStepIndex(context.status);

  return (
    <VStack align="stretch" spacing={3} fontSize="sm">
      <Stepper index={activeStep} size="sm" colorScheme="blue" gap={0}>
        {WORKFLOW_STEPS.map((step) => (
          <Step key={step.key}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <Box flexShrink={0}>
              <StepTitle fontSize="xs">{step.label}</StepTitle>
            </Box>
            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between">
          <Text color={mutedColor}>Solicitação de compra</Text>
          <Text fontWeight="medium" color={headingColor}>
            {context.purchase_request_display_code}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text color={mutedColor}>Prazo para resposta</Text>
          <Text fontWeight="medium" color={headingColor} textAlign="right" fontSize="xs">
            {formatDate(context.response_deadline)}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text color={mutedColor}>Validade do link</Text>
          <Text fontWeight="medium" color={headingColor} textAlign="right" fontSize="xs">
            {formatDate(context.expires_at)}
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
}

export function PortalQuoteSummary({ context }: PortalQuoteSummaryProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { headingColor } = useGlassTokens();

  if (isMobile) {
    return (
      <Accordion allowToggle defaultIndex={0} flexShrink={0}>
        <AccordionItem border="none">
          <AccordionButton px={1} py={1}>
            <Box flex="1" textAlign="left" fontSize="sm" fontWeight="semibold" color={headingColor}>
              Resumo da cotação
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={1} pb={2}>
            <SummaryContent context={context} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Box w="280px" flexShrink={0} px={1}>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor} mb={2}>
        Resumo
      </Text>
      <SummaryContent context={context} />
    </Box>
  );
}
