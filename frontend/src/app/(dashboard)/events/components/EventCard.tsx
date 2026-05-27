'use client';

import {
  Badge,
  Box,
  Flex,
  Select,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Clock, MapPin, Users } from 'lucide-react';
import type { Event, EventStatus } from '@/types/event';
import {
  EVENT_STATUS_OPTIONS,
  formatEventLocation,
  formatEventTimeRange,
  getEventStatusBorderColor,
  getEventStatusLabel,
} from '@/utils/eventPresentation';

interface EventCardProps {
  event: Event;
  canChangeStatus: boolean;
  statusUpdating?: boolean;
  onStatusChange: (status: EventStatus) => void;
  onOpenDetail: () => void;
}

export function EventCard({
  event,
  canChangeStatus,
  statusUpdating,
  onStatusChange,
  onOpenDetail,
}: EventCardProps) {
  const borderColor = getEventStatusBorderColor(event.status);
  const participantCount =
    event.current_participants ?? event.participants?.length ?? 0;

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const footerBorder = useColorModeValue('gray.100', 'gray.700');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const footerText = useColorModeValue('gray.600', 'gray.300');

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-status-control]')) return;
    onOpenDetail();
  };

  return (
    <Box
      mb={3}
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={cardBorder}
      borderLeftWidth="4px"
      borderLeftColor={borderColor}
      bg={cardBg}
      cursor="pointer"
      onClick={handleCardClick}
      _hover={{ shadow: 'sm' }}
      transition="box-shadow 0.2s"
    >
      <Flex mb={2} align="flex-start" justify="space-between" gap={2}>
        <Text
          flex={1}
          fontSize="sm"
          fontWeight="bold"
          noOfLines={2}
        >
          {event.title}
        </Text>
        {canChangeStatus ? (
          <Box minW="128px" flexShrink={0} data-status-control onClick={(e) => e.stopPropagation()}>
            <Select
              size="sm"
              value={event.status}
              isDisabled={statusUpdating}
              onChange={(e) => onStatusChange(e.target.value as EventStatus)}
              fontSize="11px"
              fontWeight="semibold"
            >
              {EVENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Box>
        ) : (
          <Badge
            fontSize="10px"
            fontWeight="bold"
            textTransform="uppercase"
            variant="outline"
            colorScheme="gray"
          >
            {getEventStatusLabel(event.status)}
          </Badge>
        )}
      </Flex>

      <Flex mb={2} align="center" gap={1} fontSize="xs" color={mutedText}>
        <MapPin size={12} />
        <Text>{formatEventLocation(event)}</Text>
      </Flex>

      <Flex
        mt={2}
        pt={2}
        align="center"
        justify="space-between"
        borderTopWidth="1px"
        borderColor={footerBorder}
        fontSize="xs"
        color={footerText}
      >
        <Flex align="center" gap={1}>
          <Clock size={12} />
          <Text>{formatEventTimeRange(event)}</Text>
        </Flex>
        {participantCount > 0 ? (
          <Flex align="center" gap={1} fontSize="10px" color={mutedText}>
            <Users size={11} />
            <Text>{participantCount} part.</Text>
          </Flex>
        ) : (
          <Text fontSize="10px" color={mutedText} noOfLines={1}>
            Resp: {event.user?.name ?? '—'}
          </Text>
        )}
      </Flex>
    </Box>
  );
}
