'use client';

import { Box, Skeleton, SkeletonText } from '@chakra-ui/react';

export function AdminTabSkeleton() {
    return (
        <Box
            data-testid="admin-tab-skeleton"
            flex="1"
            minH={0}
            display="flex"
            flexDirection="column"
            p={2}
        >
            <Skeleton height="32px" mb={2} flexShrink={0} />
            <Box flex="1" minH={0}>
                <SkeletonText mt="2" noOfLines={12} spacing="3" />
            </Box>
        </Box>
    );
}
