'use client';

import { Suspense, useCallback, useMemo } from 'react';
import {
  Box,
  Center,
  Flex,
  Heading,
  Spinner,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stack,
} from '@chakra-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MaintenanceSchedulesList } from '@/components/maintenance/MaintenanceSchedulesList';
import { MaintenanceTasksPanel } from '@/components/maintenance/MaintenanceTasksPanel';

const TAB_SCHEDULES = 'schedules';
const TAB_TASKS = 'tasks';

function tabIndexFromParam(tab: string | null): number {
  if (tab === TAB_TASKS) return 1;
  return 0;
}

function paramFromTabIndex(index: number): string {
  return index === 1 ? TAB_TASKS : TAB_SCHEDULES;
}

function MaintenanceHubContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const tabIndex = useMemo(() => tabIndexFromParam(tabParam), [tabParam]);

  const setTabIndex = useCallback(
    (index: number) => {
      const next = paramFromTabIndex(index);
      const params = new URLSearchParams(searchParams.toString());
      if (next === TAB_SCHEDULES) {
        params.delete('tab');
      } else {
        params.set('tab', next);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <Box px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} maxW="container.xl" mx="auto" w="full">
      <Stack spacing={3}>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'stretch', sm: 'baseline' }}
          justify="space-between"
          gap={2}
          flexWrap="wrap"
        >
          <Heading size="md" color="gray.900" lineHeight="shorter">
            Manutenção
          </Heading>
          <Text color="gray.600" fontSize="sm" noOfLines={2} flex={{ base: 'none', sm: '1' }} minW={0}>
            Planos preventivos e tarefas
          </Text>
        </Flex>

        <Tabs
          isLazy
          index={tabIndex}
          onChange={setTabIndex}
          colorScheme="blue"
          variant="enclosed"
        >
          <TabList borderBottomWidth="1px">
            <Tab py={2} px={4} fontSize="sm" fontWeight="semibold">
              Planos
            </Tab>
            <Tab py={2} px={4} fontSize="sm" fontWeight="semibold">
              Tarefas
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0} pt={3} pb={0}>
              <MaintenanceSchedulesList />
            </TabPanel>
            <TabPanel px={0} pt={3} pb={0}>
              <MaintenanceTasksPanel />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Box>
  );
}

function MaintenanceHubFallback() {
  return (
    <Center minH="30vh" py={6}>
      <Spinner size="md" color="blue.500" />
    </Center>
  );
}

export default function MaintenanceSchedulesPage() {
  return (
    <Suspense fallback={<MaintenanceHubFallback />}>
      <MaintenanceHubContent />
    </Suspense>
  );
}
