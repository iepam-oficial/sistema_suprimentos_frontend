'use client';

import { Button, ButtonGroup } from '@chakra-ui/react';

export type SupplyRequestsViewMode = 'per-order' | 'per-item';

export const SUPPLY_REQUESTS_VIEW_MODE_STORAGE_KEY =
    '@ti-assistant:adminSupplyRequestsViewMode';

interface SupplyRequestsViewToggleProps {
    value: SupplyRequestsViewMode;
    onChange: (mode: SupplyRequestsViewMode) => void;
}

export function SupplyRequestsViewToggle({
    value,
    onChange,
}: SupplyRequestsViewToggleProps) {
    return (
        <ButtonGroup size="sm" isAttached variant="outline">
            <Button
                colorScheme={value === 'per-order' ? 'blue' : 'gray'}
                variant={value === 'per-order' ? 'solid' : 'outline'}
                onClick={() => onChange('per-order')}
            >
                Por pedido
            </Button>
            <Button
                colorScheme={value === 'per-item' ? 'blue' : 'gray'}
                variant={value === 'per-item' ? 'solid' : 'outline'}
                onClick={() => onChange('per-item')}
            >
                Por item
            </Button>
        </ButtonGroup>
    );
}
