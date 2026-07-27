'use client';

import { useMemo } from 'react';
import {
  Box,
  Flex,
  Grid,
  IconButton,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '@/types/event';
import {
  buildMonthGrid,
  datesWithEvents,
  formatMonthYear,
  getWeekdayLabels,
  isSameCalendarDay,
} from '@/utils/eventPresentation';

interface MonthCalendarProps {
  visibleMonth: Date;
  selectedDate: Date;
  events: Event[];
  onMonthChange: (next: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  events,
  onMonthChange,
  onSelectDate,
}: MonthCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const eventDays = useMemo(
    () => datesWithEvents(events, visibleMonth),
    [events, visibleMonth]
  );
  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const weekdayColor = useColorModeValue('gray.400', 'gray.500');
  const dayInMonth = useColorModeValue('gray.700', 'gray.200');
  const dayOutMonth = useColorModeValue('gray.300', 'gray.600');
  const todayBorder = useColorModeValue('blue.200', 'blue.700');
  const todayBg = useColorModeValue('blue.50', 'blue.900');

  const prevMonth = () => {
    onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1));
  };

  return (
    <Box
      mb={5}
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      bg={cardBg}
    >
      <Flex mb={4} align="center" justify="space-between">
        <IconButton
          aria-label="Mês anterior"
          icon={<ChevronLeft size={22} />}
          variant="ghost"
          size="sm"
          onClick={prevMonth}
        />
        <Text fontSize="sm" fontWeight="bold">
          {formatMonthYear(visibleMonth)}
        </Text>
        <IconButton
          aria-label="Próximo mês"
          icon={<ChevronRight size={22} />}
          variant="ghost"
          size="sm"
          onClick={nextMonth}
        />
      </Flex>

      <Grid templateColumns="repeat(7, 1fr)" mb={2} pb={2} borderBottomWidth="1px" borderColor={borderColor}>
        {getWeekdayLabels().map((label, i) => (
          <Text key={`${label}-${i}`} fontSize="10px" fontWeight="bold" textAlign="center" color={weekdayColor}>
            {label}
          </Text>
        ))}
      </Grid>

      <Grid templateColumns="repeat(7, 1fr)">
        {grid.map((cell, index) => {
          if (!cell.date) {
            return <Box key={index} py={1} />;
          }

          const isToday = isSameCalendarDay(cell.date, today);
          const isSelected = isSameCalendarDay(cell.date, selectedDate);
          const hasEvents =
            cell.inCurrentMonth && eventDays.has(cell.date.getDate());

          return (
            <Flex
              key={index}
              py={1}
              justify="center"
              cursor="pointer"
              onClick={() => onSelectDate(cell.date!)}
              role="button"
              aria-label={`Dia ${cell.day}`}
            >
              <Box position="relative" display="flex" flexDirection="column" alignItems="center">
                <Flex
                  w={7}
                  h={7}
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bg={isSelected ? 'blue.500' : isToday ? todayBg : undefined}
                  borderWidth={isToday && !isSelected ? '1px' : undefined}
                  borderColor={isToday && !isSelected ? todayBorder : undefined}
                >
                  <Text
                    fontSize="sm"
                    fontWeight={isSelected || isToday ? 'bold' : 'normal'}
                    color={
                      isSelected
                        ? 'white'
                        : isToday
                          ? 'blue.500'
                          : cell.inCurrentMonth
                            ? dayInMonth
                            : dayOutMonth
                    }
                  >
                    {cell.day}
                  </Text>
                </Flex>
                {hasEvents && (
                  <Box
                    position="absolute"
                    bottom={0}
                    w={1}
                    h={1}
                    borderRadius="full"
                    bg={isSelected ? 'white' : 'blue.500'}
                  />
                )}
              </Box>
            </Flex>
          );
        })}
      </Grid>
    </Box>
  );
}
