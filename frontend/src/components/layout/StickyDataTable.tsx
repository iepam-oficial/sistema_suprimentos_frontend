'use client';

import { Table, Td, Th, Thead, type TableProps } from '@chakra-ui/react';
import { useGlassTokens } from './useGlassTokens';

export interface StickyDataTableProps extends TableProps {
  children: React.ReactNode;
}

export function StickyDataTable({ children, ...rest }: StickyDataTableProps) {
  const { theadBg } = useGlassTokens();

  return (
    <Table
      size="sm"
      variant="simple"
      sx={{
        'thead tr th': {
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bg: theadBg,
          py: '6px',
        },
        'tbody tr td': {
          py: '6px',
        },
      }}
      {...rest}
    >
      {children}
    </Table>
  );
}

export { Thead, Th, Td };
