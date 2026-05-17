import {
    Box,
    Container,
    Flex,
    Heading,
    Text,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    VStack,
    Card,
    CardBody,
    useColorModeValue,
    HStack,
    Divider,
    Button,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
} from '@chakra-ui/react';
import { MoreVertical, Plus, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
    id: string;
    title: string;
    description: string;
    type: EventType;
    start_date: Date;
    start_time: string;
    end_date: Date;
    location: string;
    room?: string;
    capacity?: number;
    is_public?: boolean;
    max_participants?: number;
    budget?: number;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    setup_requirements?: string;
    notes?: string;
    status: EventStatus;
    current_participants: number;
    user: {
        id: string;
        name: string;
    };
    participants: {
        id: string;
        user: {
            id: string;
            name: string;
        };
        role: string;
        status: string;
    }[];
    resources: {
        id: string;
        name: string;
        quantity: number;
        description?: string;
    }[];
}

type EventType = 'FESTA' | 'AULA' | 'FORMATURA' | 'REUNIAO' | 'FEIRA_TECNOLOGICA' | 'ALUGUEL_SALA' | 'OUTRO';
type EventStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

interface MobileEventsProps {
    events: Event[];
    onDelete: (id: string) => void;
    onSubmit: (data: any) => void;
}

export function MobileEvents({ events, onDelete, onSubmit }: MobileEventsProps) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'OUTRO' as EventType,
        start_date: '',
        start_time: '00:00',
        end_date: '',
        location: '',
        room: '',
        capacity: 0,
        is_public: false,
        max_participants: 0,
        budget: 0,
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        setup_requirements: '',
        notes: '',
        status: 'AGENDADO' as EventStatus,
    });
    const router = useRouter();

    const handleEdit = (event: Event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description,
            type: event.type,
            start_date: new Date(event.start_date).toISOString().split('T')[0],
            start_time: event.start_time,
            end_date: new Date(event.end_date).toISOString().split('T')[0],
            location: event.location,
            room: event.room || '',
            capacity: event.capacity || 0,
            is_public: event.is_public || false,
            max_participants: event.max_participants || 0,
            budget: event.budget || 0,
            contact_name: event.contact_name || '',
            contact_phone: event.contact_phone || '',
            contact_email: event.contact_email || '',
            setup_requirements: event.setup_requirements || '',
            notes: event.notes || '',
            status: event.status,
        });
        onOpen();
    };

    const handleNew = () => {
        setSelectedEvent(null);
        setFormData({
            title: '',
            description: '',
            type: 'OUTRO' as EventType,
            start_date: '',
            start_time: '00:00',
            end_date: '',
            location: '',
            room: '',
            capacity: 0,
            is_public: false,
            max_participants: 0,
            budget: 0,
            contact_name: '',
            contact_phone: '',
            contact_email: '',
            setup_requirements: '',
            notes: '',
            status: 'AGENDADO' as EventStatus,
        });
        onOpen();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <Container maxW="container.xl" py={4} px={0} w="full">
            <Flex justify="space-between" align="center" mb={4} mt="4vh">
                <Heading size="md">Eventos</Heading>
                <Button
                    leftIcon={<Plus />}
                    colorScheme="blue"
                    size="sm"
                    onClick={handleNew}
                >
                    Novo
                </Button>
            </Flex>

            <VStack spacing={4} align="stretch">
                {events.length === 0 ? (
                    <Card>
                        <CardBody>
                            <Text textAlign="center" color="gray.500">
                                Nenhum evento encontrado
                            </Text>
                        </CardBody>
                    </Card>
                ) : (
                    events.map((event) => (
                        <Card
                            key={event.id}
                            variant="outline"
                            onClick={() => router.push(`/events/${event.id}`)}
                            _hover={{
                                cursor: 'pointer',
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out',
                            }}
                        >
                            <CardBody>
                                <VStack align="stretch" spacing={3}>
                                    <Flex justify="space-between" align="center">
                                        <Heading size="sm">{event.title}</Heading>
                                        <Menu>
                                            <MenuButton
                                                as={IconButton}
                                                aria-label="Mais opções"
                                                icon={<Icon as={MoreVertical} sx={{ '& svg': { stroke: 'currentColor' } }} />}
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <MenuList>
                                                <MenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(event);
                                                }}>
                                                    Editar
                                                </MenuItem>
                                                <MenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(event.id);
                                                }}>
                                                    Excluir
                                                </MenuItem>
                                            </MenuList>
                                        </Menu>
                                    </Flex>

                                    <Box>
                                        <Text fontWeight="bold" fontSize="sm">Descrição</Text>
                                        <Text fontSize="sm">{event.description}</Text>
                                    </Box>

                                    <Divider />

                                    <HStack justify="space-between">
                                        <Box>
                                            <Text fontWeight="bold" fontSize="sm">Data</Text>
                                            <Text fontSize="sm">
                                                {new Date(event.start_date).toLocaleDateString()} às {event.start_time} - {new Date(event.end_date).toLocaleDateString()}
                                            </Text>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="bold" fontSize="sm">Tipo</Text>
                                            <Text fontSize="sm">
                                                {event.type === 'FESTA' ? 'Festa' : event.type === 'AULA' ? 'Aula' : event.type === 'FORMATURA' ? 'Formatura' : event.type === 'REUNIAO' ? 'Reunião' : event.type === 'FEIRA_TECNOLOGICA' ? 'Feira Tecnológica' : event.type === 'ALUGUEL_SALA' ? 'Aluguel de Sala' : 'Outro'}
                                            </Text>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="bold" fontSize="sm">Local</Text>
                                            <Text fontSize="sm">
                                                {event.location}
                                            </Text>
                                        </Box>
                                    </HStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    ))
                )}
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <form onSubmit={handleSubmit}>
                            <FormControl mb={4}>
                                <FormLabel>Título</FormLabel>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Descrição</FormLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Data de Início</FormLabel>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Hora de Início</FormLabel>
                                <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    required
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Data de Término</FormLabel>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Local</FormLabel>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Sala</FormLabel>
                                <Input
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Capacidade</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Evento Público</FormLabel>
                                <Select
                                    value={formData.is_public ? 'true' : 'false'}
                                    onChange={(e) => setFormData({ ...formData, is_public: e.target.value === 'true' })}
                                >
                                    <option value="true">Sim</option>
                                    <option value="false">Não</option>
                                </Select>
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Máximo de Participantes</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.max_participants}
                                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Orçamento</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Nome do Contato</FormLabel>
                                <Input
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Telefone do Contato</FormLabel>
                                <Input
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Email do Contato</FormLabel>
                                <Input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Requisitos de Configuração</FormLabel>
                                <Textarea
                                    value={formData.setup_requirements}
                                    onChange={(e) => setFormData({ ...formData, setup_requirements: e.target.value })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Observações</FormLabel>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel>Tipo</FormLabel>
                                <Select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                                    required
                                >
                                    <option value="FESTA">Festa</option>
                                    <option value="AULA">Aula</option>
                                    <option value="FORMATURA">Formatura</option>
                                    <option value="REUNIAO">Reunião</option>
                                    <option value="FEIRA_TECNOLOGICA">Feira Tecnológica</option>
                                    <option value="ALUGUEL_SALA">Aluguel de Sala</option>
                                    <option value="OUTRO">Outro</option>
                                </Select>
                            </FormControl>

                            <Button type="submit" colorScheme="blue" mr={3}>
                                Salvar
                            </Button>
                            <Button onClick={onClose}>Cancelar</Button>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Container>
    );
} 