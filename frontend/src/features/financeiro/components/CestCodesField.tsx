'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';

interface CestCodesFieldProps {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  isDisabled?: boolean;
}

function normalizeDraft(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function CestCodesField({ value, onChange, error, isDisabled }: CestCodesFieldProps) {
  const [draft, setDraft] = useState('');

  const addCode = () => {
    const code = normalizeDraft(draft);
    if (!code) {
      setDraft('');
      return;
    }
    if (!value.includes(code)) {
      onChange([...value, code]);
    }
    setDraft('');
  };

  const removeCode = (code: string) => {
    onChange(value.filter((item) => item !== code));
  };

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel>Códigos CEST</FormLabel>
      <HStack>
        <Input
          value={draft}
          isDisabled={isDisabled}
          placeholder="Ex: 1708400 (7 dígitos)"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addCode();
            }
          }}
        />
        <Button onClick={addCode} isDisabled={isDisabled || !draft.trim()} variant="outline">
          Adicionar
        </Button>
      </HStack>
      <FormHelperText>Pressione Enter ou clique em Adicionar para incluir um código.</FormHelperText>
      {value.length > 0 && (
        <Box mt={2}>
          <Wrap>
            {value.map((code) => (
              <WrapItem key={code}>
                <Tag size="md" colorScheme="blue" borderRadius="full">
                  <TagLabel>{code}</TagLabel>
                  {!isDisabled && <TagCloseButton onClick={() => removeCode(code)} />}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
}
