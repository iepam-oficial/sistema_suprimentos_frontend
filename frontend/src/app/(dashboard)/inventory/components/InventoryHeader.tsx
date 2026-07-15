import React from 'react';
import { Button, HStack, Menu, MenuButton, MenuList, MenuItem, useBreakpointValue } from '@chakra-ui/react';
import { FiPlus, FiBarChart2, FiFilter } from 'react-icons/fi';
import Link from 'next/link';
import { GroupByOption } from '../types';

interface InventoryHeaderProps {
  onOpen: () => void;
  onExportPDF: () => void;
  onDepreciateAll: () => void;
  groupBy: GroupByOption;
  setGroupBy: (value: GroupByOption) => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  onOpen,
  onExportPDF,
  onDepreciateAll,
  groupBy,
  setGroupBy,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = isMobile ? 'xs' : 'sm';

  return (
    <HStack spacing={1} flexShrink={0} flexWrap="wrap" justify={isMobile ? 'flex-start' : 'flex-end'}>
      <Menu>
        <MenuButton as={Button} leftIcon={<FiFilter />} size={buttonSize} variant="outline">
          Agrupar por
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => setGroupBy('none')}>Sem agrupamento</MenuItem>
          <MenuItem onClick={() => setGroupBy('location')}>Localização</MenuItem>
          <MenuItem onClick={() => setGroupBy('category')}>Categoria</MenuItem>
          <MenuItem onClick={() => setGroupBy('status')}>Status</MenuItem>
          <MenuItem onClick={() => setGroupBy('subcategory')}>Subcategoria</MenuItem>
        </MenuList>
      </Menu>
      <Button
        leftIcon={<FiBarChart2 />}
        colorScheme="purple"
        as={Link}
        href="/reports?report=inventory-overview"
        size={buttonSize}
      >
        Relatórios
      </Button>
      <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen} size={buttonSize}>
        Novo Item
      </Button>
      <Button colorScheme="green" onClick={onExportPDF} size={buttonSize}>
        Exportar PDF
      </Button>
      <Button colorScheme="orange" onClick={onDepreciateAll} size={buttonSize}>
        Atualizar Depreciação
      </Button>
    </HStack>
  );
};
