'use client';

import { useLayoutEffect, useState, type Ref, type RefObject } from 'react';
import { List, Portal, useColorModeValue } from '@chakra-ui/react';
import { computeAnchoredRect } from '@/lib/anchoredDropdownPosition';

interface AnchoredDropdownListProps {
  anchorRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  listRef?: Ref<HTMLUListElement>;
  maxH?: string;
  children: React.ReactNode;
}

export function AnchoredDropdownList({
  anchorRef,
  isOpen,
  listRef,
  maxH = '200px',
  children,
}: AnchoredDropdownListProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const listBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const next = computeAnchoredRect(anchor.getBoundingClientRect());
      setPosition(next);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <List
        ref={listRef}
        position="fixed"
        top={`${position.top}px`}
        left={`${position.left}px`}
        width={`${position.width}px`}
        zIndex={1500}
        maxH={maxH}
        overflowY="auto"
        bg={listBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        boxShadow="md"
      >
        {children}
      </List>
    </Portal>
  );
}
