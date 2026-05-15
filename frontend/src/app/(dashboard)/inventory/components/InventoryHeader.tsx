import React from 'react';
import { Button, HStack, VStack, Heading, Menu, MenuButton, MenuList, MenuItem, useColorMode, useBreakpointValue } from '@chakra-ui/react';
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

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ onOpen, onExportPDF, onDepreciateAll, groupBy, setGroupBy }) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <HStack spacing={2} w="100%" justify={isMobile ? "space-between" : "flex-end"} wrap="wrap">
      {isMobile ? (
        <VStack spacing={2} w="100%">
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen} size="sm" w="100%">Novo Item</Button>
          <Button leftIcon={<FiBarChart2 />} colorScheme="purple" as={Link} href="/reports?report=inventory-overview" size="sm" w="100%">Relatórios</Button>
          <Button colorScheme="green" onClick={onExportPDF} size="sm" w="100%">Exportar PDF</Button>
          <Button colorScheme="orange" onClick={onDepreciateAll} size="sm" w="100%">Atualizar Depreciação</Button>
        </VStack>
      ) : (
        <>
          <Menu>
            <MenuButton as={Button} leftIcon={<FiFilter />} size="md">Agrupar por</MenuButton>
            <MenuList>
              <MenuItem onClick={() => setGroupBy('none')}>Sem agrupamento</MenuItem>
              <MenuItem onClick={() => setGroupBy('location')}>Localização</MenuItem>
              <MenuItem onClick={() => setGroupBy('category')}>Categoria</MenuItem>
              <MenuItem onClick={() => setGroupBy('status')}>Status</MenuItem>
              <MenuItem onClick={() => setGroupBy('subcategory')}>Subcategoria</MenuItem>
            </MenuList>
          </Menu>
          <Button leftIcon={<FiBarChart2 />} colorScheme="purple" as={Link} href="/reports?report=inventory-overview" size="md">Relatórios</Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen} size="md">Novo Item</Button>
          <Button colorScheme="green" onClick={onExportPDF} size="md">Exportar PDF</Button>
          <Button colorScheme="orange" onClick={onDepreciateAll} size="md">Atualizar Depreciação</Button>
        </>
      )}
    </HStack>
  );
}; 