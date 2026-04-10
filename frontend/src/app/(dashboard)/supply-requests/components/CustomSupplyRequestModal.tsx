import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    VStack,
    HStack,
    useToast,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Select,
    Box,
    Text,
    Badge,
    Grid,
    GridItem,
    Divider,
    IconButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';

interface CustomSupplyRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomSupplyRequestBatchPayload) => Promise<void>;
    userLocales: { id: string; name: string }[];
    localeId: string;
    setLocaleId: (value: string) => void;
}

export interface CustomSupplyRequestData {
    item_name: string;
    description?: string;
    quantity: number;
    unit_id: string;
    delivery_deadline: string;
    destination: string;
    locale_id?: string;
    notes?: string;
}

export interface CustomSupplyRequestBatchPayload {
    items: CustomSupplyRequestData[];
}

interface Unit {
    id: string;
    name: string;
}

interface LineState {
    id: string;
    item_name: string;
    description: string;
    quantity: number;
    unit_id: string;
    notes: string;
}

function createEmptyLine(): LineState {
    return {
        id:
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `line-${Date.now()}-${Math.random()}`,
        item_name: '',
        description: '',
        quantity: 1,
        unit_id: '',
        notes: '',
    };
}

export function CustomSupplyRequestModal({
    isOpen,
    onClose,
    onSubmit,
    userLocales,
    localeId,
    setLocaleId,
}: CustomSupplyRequestModalProps) {
    const [lines, setLines] = useState<LineState[]>([createEmptyLine()]);
    const [deliveryDeadline, setDeliveryDeadline] = useState('');
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchUnits();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLines([createEmptyLine()]);
            setDeliveryDeadline('');
        }
    }, [isOpen]);

    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            const response = await fetch('/api/unit-of-measures', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUnits(data);
            }
        } catch (error) {
            console.error('Erro ao buscar unidades:', error);
        }
    };

    const updateLine = (id: string, patch: Partial<LineState>) => {
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    };

    const addLine = () => setLines((prev) => [...prev, createEmptyLine()]);

    const removeLine = (id: string) => {
        setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
    };

    const handleSubmit = async () => {
        if (!deliveryDeadline || !localeId) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Informe a data limite de entrega e o destino.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const invalid = lines.some((l) => !l.item_name?.trim() || !l.quantity || !l.unit_id);
        if (invalid) {
            toast({
                title: 'Itens incompletos',
                description: 'Cada item precisa de nome, quantidade e unidade de medida.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const selectedLocale = userLocales.find((l) => l.id === localeId);
        const destination = selectedLocale ? selectedLocale.name : '';

        const items: CustomSupplyRequestData[] = lines.map((l) => ({
            item_name: l.item_name.trim(),
            description: l.description.trim() || undefined,
            quantity: l.quantity,
            unit_id: l.unit_id,
            delivery_deadline: deliveryDeadline,
            destination,
            locale_id: localeId,
            notes: l.notes.trim() || undefined,
        }));

        setLoading(true);
        try {
            await onSubmit({ items });
            setLines([createEmptyLine()]);
            setDeliveryDeadline('');
            setLocaleId('');
            onClose();
        } catch (error) {
            toast({
                title: 'Erro ao enviar',
                description:
                    error instanceof Error ? error.message : 'Erro ao criar requisição customizada',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(2px)" />
            <ModalContent borderRadius="xl" data-testid="custom-request-modal">

                {/* Header */}
                <ModalHeader pb={2}>
                    <Text fontSize="md" fontWeight="semibold">
                        Requisição customizada
                    </Text>
                    <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={0.5}>
                        Preencha os dados e adicione os itens do pedido
                    </Text>
                </ModalHeader>
                <ModalCloseButton top={4} right={4} />

                <Divider />

                {/* Body */}
                <ModalBody py={5}>
                    <VStack spacing={5} align="stretch">

                        {/* Campos globais lado a lado */}
                        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
                            <GridItem>
                                <FormControl isRequired>
                                    <FormLabel
                                        fontSize="sm"
                                        fontWeight="medium"
                                        mb={1}
                                        color="gray.800"
                                        opacity={1}
                                        _dark={{ color: 'gray.100' }}
                                    >
                                        Data limite de entrega
                                    </FormLabel>
                                    <Input
                                        data-testid="custom-request-delivery-deadline"
                                        type="date"
                                        size="sm"
                                        borderRadius="md"
                                        value={deliveryDeadline}
                                        onChange={(e) => setDeliveryDeadline(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </FormControl>
                            </GridItem>
                            <GridItem>
                                <FormControl isRequired>
                                    <FormLabel
                                        fontSize="sm"
                                        fontWeight="medium"
                                        mb={1}
                                        color="gray.800"
                                        opacity={1}
                                        _dark={{ color: 'gray.100' }}
                                    >
                                        Destino
                                    </FormLabel>
                                    <Select
                                        data-testid="custom-request-destination"
                                        size="sm"
                                        borderRadius="md"
                                        placeholder="Selecione o local"
                                        value={localeId}
                                        onChange={(e) => setLocaleId(e.target.value)}
                                    >
                                        {userLocales.map((locale) => (
                                            <option key={locale.id} value={locale.id}>
                                                {locale.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            </GridItem>
                        </Grid>

                        <Divider />

                        {/* Título da seção de itens */}
                        <HStack spacing={2} align="center">
                            <Text fontSize="sm" fontWeight="semibold">
                                Itens do pedido
                            </Text>
                            <Badge
                                colorScheme="gray"
                                borderRadius="full"
                                px={2}
                                fontSize="xs"
                                fontWeight="medium"
                            >
                                {lines.length} {lines.length === 1 ? 'item' : 'itens'}
                            </Badge>
                        </HStack>

                        {/* Cards de item */}
                        {lines.map((line, index) => (
                            <Box
                                key={line.id}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="lg"
                                overflow="hidden"
                                _dark={{ borderColor: 'gray.600' }}
                            >
                                {/* Cabeçalho do card */}
                                <HStack
                                    justify="space-between"
                                    px={4}
                                    py={2.5}
                                    bg="gray.50"
                                    borderBottom="1px solid"
                                    borderColor="gray.200"
                                    _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                                >
                                    <Text fontSize="sm" fontWeight="semibold">
                                        Item {index + 1}
                                    </Text>
                                    {lines.length > 1 && (
                                        <IconButton
                                            aria-label="Remover item"
                                            icon={<DeleteIcon />}
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => removeLine(line.id)}
                                        />
                                    )}
                                </HStack>

                                {/* Campos do item */}
                                <VStack spacing={3} align="stretch" p={4}>
                                    <FormControl isRequired>
                                        <FormLabel
                                            fontSize="sm"
                                            fontWeight="medium"
                                            mb={1}
                                            color="gray.800"
                                            opacity={1}
                                            _dark={{ color: 'gray.100' }}
                                        >
                                            Nome do item
                                        </FormLabel>
                                        <Input
                                            data-testid={`custom-request-item-name-${index}`}
                                            size="sm"
                                            borderRadius="md"
                                            placeholder="Ex: Monitor LED 24 polegadas"
                                            value={line.item_name}
                                            onChange={(e) =>
                                                updateLine(line.id, { item_name: e.target.value })
                                            }
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel
                                            fontSize="sm"
                                            fontWeight="medium"
                                            mb={1}
                                            color="gray.800"
                                            opacity={1}
                                            _dark={{ color: 'gray.100' }}
                                        >
                                            Descrição
                                        </FormLabel>
                                        <Textarea
                                            size="sm"
                                            borderRadius="md"
                                            rows={2}
                                            resize="vertical"
                                            placeholder="Detalhes opcionais..."
                                            value={line.description}
                                            onChange={(e) =>
                                                updateLine(line.id, { description: e.target.value })
                                            }
                                        />
                                    </FormControl>

                                    <Grid templateColumns="120px 1fr" gap={3} alignItems="end">
                                        <GridItem>
                                            <FormControl isRequired>
                                                <FormLabel
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    mb={1}
                                                    color="gray.800"
                                                    opacity={1}
                                                    _dark={{ color: 'gray.100' }}
                                                >
                                                    Quantidade
                                                </FormLabel>
                                                <NumberInput
                                                    size="sm"
                                                    value={line.quantity}
                                                    onChange={(_, value) =>
                                                        updateLine(line.id, { quantity: value })
                                                    }
                                                    min={1}
                                                >
                                                    <NumberInputField
                                                        data-testid={`custom-request-item-qty-${index}`}
                                                        borderRadius="md"
                                                    />
                                                    <NumberInputStepper>
                                                        <NumberIncrementStepper />
                                                        <NumberDecrementStepper />
                                                    </NumberInputStepper>
                                                </NumberInput>
                                            </FormControl>
                                        </GridItem>
                                        <GridItem>
                                            <FormControl isRequired>
                                                <FormLabel
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    mb={1}
                                                    color="gray.800"
                                                    opacity={1}
                                                    _dark={{ color: 'gray.100' }}
                                                >
                                                    Unidade de medida
                                                </FormLabel>
                                                <Select
                                                    data-testid={`custom-request-item-unit-${index}`}
                                                    size="sm"
                                                    borderRadius="md"
                                                    placeholder="Selecione"
                                                    value={line.unit_id}
                                                    onChange={(e) =>
                                                        updateLine(line.id, { unit_id: e.target.value })
                                                    }
                                                >
                                                    {units.map((unit) => (
                                                        <option key={unit.id} value={unit.id}>
                                                            {unit.name}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </GridItem>
                                    </Grid>

                                    <FormControl>
                                        <FormLabel
                                            fontSize="sm"
                                            fontWeight="medium"
                                            mb={1}
                                            color="gray.800"
                                            opacity={1}
                                            _dark={{ color: 'gray.100' }}
                                        >
                                            Observações
                                        </FormLabel>
                                        <Textarea
                                            data-testid={`custom-request-item-notes-${index}`}
                                            size="sm"
                                            borderRadius="md"
                                            rows={2}
                                            resize="vertical"
                                            placeholder="Observações sobre este item..."
                                            value={line.notes}
                                            onChange={(e) =>
                                                updateLine(line.id, { notes: e.target.value })
                                            }
                                        />
                                    </FormControl>
                                </VStack>
                            </Box>
                        ))}

                        {/* Botão adicionar item */}
                        <Button
                            data-testid="custom-request-add-line"
                            size="sm"
                            variant="outline"
                            leftIcon={<AddIcon boxSize={2.5} />}
                            onClick={addLine}
                            alignSelf="flex-start"
                            borderStyle="dashed"
                            colorScheme="blue"
                            borderRadius="md"
                        >
                            Adicionar item
                        </Button>
                    </VStack>
                </ModalBody>

                <Divider />

                {/* Footer */}
                <ModalFooter gap={2} pt={4}>
                    <Button size="sm" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        data-testid="custom-request-submit"
                        size="sm"
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="Enviando..."
                    >
                        Enviar requisição
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}