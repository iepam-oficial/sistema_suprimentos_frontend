'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Container,
    VStack,
    Heading,
    Text,
    HStack,
    Badge,
    useColorMode,
    Card,
    CardBody,
    CardHeader,
    Divider,
    useBreakpointValue,
} from '@chakra-ui/react';
import { ArrowLeft, Calendar, MapPin, Users, Phone, Mail, FileText } from 'lucide-react';

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

export default function EventDetailsPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { colorMode } = useColorMode();
    const isMobile = useBreakpointValue({ base: true, md: false });

    useEffect(() => {
        fetchEventDetails();
    }, [params.id]);

    const fetchEventDetails = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            const response = await fetch(`/api/events/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 429) {
                router.push('/rate-limit')
                return
            }

            if (!response.ok) {
                throw new Error('Erro ao buscar detalhes do evento');
            }

            const data = await response.json();
            setEvent(data);
        } catch (error) {
            console.error('Erro ao buscar detalhes do evento:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: EventStatus) => {
        switch (status) {
            case 'AGENDADO':
                return 'yellow';
            case 'EM_ANDAMENTO':
                return 'blue';
            case 'CONCLUIDO':
                return 'green';
            case 'CANCELADO':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getStatusLabel = (status: EventStatus) => {
        switch (status) {
            case 'AGENDADO':
                return 'Agendado';
            case 'EM_ANDAMENTO':
                return 'Em Andamento';
            case 'CONCLUIDO':
                return 'Concluído';
            case 'CANCELADO':
                return 'Cancelado';
            default:
                return status;
        }
    };

    if (loading) {
        return <Box p={8}>Carregando...</Box>;
    }

    if (!event) {
        return <Box p={8}>Evento não encontrado</Box>;
    }

    return (
        <Box
            w="full"
            h="full"
            py={isMobile ? 0 : 4}
            px={isMobile ? 0 : 8}
            marginTop={isMobile ? '4vh' : 0}
        >
            <VStack spacing={6} align="stretch" w="full">
                <Button
                    leftIcon={<ArrowLeft size={18} />}
                    variant="ghost"
                    alignSelf="flex-start"
                    onClick={() => router.push('/events')}
                >
                    Voltar
                </Button>
                <Card
                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                    backdropFilter="blur(12px)"
                    borderWidth="1px"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    w="full"
                >
                    <CardHeader>
                        <VStack align="start" spacing={2}>
                            <Heading size="lg">{event.title}</Heading>
                            <Badge colorScheme={getStatusColor(event.status)}>
                                {getStatusLabel(event.status)}
                            </Badge>
                        </VStack>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={6} align="stretch">
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" mb={2}>Descrição</Text>
                                <Text>{event.description}</Text>
                            </Box>

                            <Divider />

                            <VStack align="start" spacing={2}>
                                <HStack>
                                    <Calendar size={20} />
                                    <Text>Data de Início: {new Date(event.start_date).toLocaleDateString()} às {event.start_time}</Text>
                                </HStack>
                                <HStack>
                                    <Calendar size={20} />
                                    <Text>Data de Término: {new Date(event.end_date).toLocaleDateString()}</Text>
                                </HStack>
                            </VStack>

                            <Divider />

                            <VStack align="start" spacing={2}>
                                <HStack>
                                    <MapPin size={20} />
                                    <Text>Local: {event.location}</Text>
                                </HStack>
                                {event.room && (
                                    <HStack>
                                        <MapPin size={20} />
                                        <Text>Sala: {event.room}</Text>
                                    </HStack>
                                )}
                            </VStack>

                            <Divider />

                            <VStack align="start" spacing={2}>
                                <HStack>
                                    <Users size={20} />
                                    <Text>Participantes: {event.current_participants}/{event.max_participants || '∞'}</Text>
                                </HStack>
                                {event.capacity && (
                                    <HStack>
                                        <Users size={20} />
                                        <Text>Capacidade: {event.capacity}</Text>
                                    </HStack>
                                )}
                            </VStack>

                            {event.contact_name && (
                                <>
                                    <Divider />
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="lg" fontWeight="bold">Informações de Contato</Text>
                                        <HStack>
                                            <Users size={20} />
                                            <Text>Nome: {event.contact_name}</Text>
                                        </HStack>
                                        {event.contact_phone && (
                                            <HStack>
                                                <Phone size={20} />
                                                <Text>Telefone: {event.contact_phone}</Text>
                                            </HStack>
                                        )}
                                        {event.contact_email && (
                                            <HStack>
                                                <Mail size={20} />
                                                <Text>Email: {event.contact_email}</Text>
                                            </HStack>
                                        )}
                                    </VStack>
                                </>
                            )}

                            {event.setup_requirements && (
                                <>
                                    <Divider />
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="lg" fontWeight="bold">Requisitos de Configuração</Text>
                                        <HStack align="start">
                                            <FileText size={20} />
                                            <Text>{event.setup_requirements}</Text>
                                        </HStack>
                                    </VStack>
                                </>
                            )}

                            {event.notes && (
                                <>
                                    <Divider />
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="lg" fontWeight="bold">Observações</Text>
                                        <HStack align="start">
                                            <FileText size={20} />
                                            <Text>{event.notes}</Text>
                                        </HStack>
                                    </VStack>
                                </>
                            )}

                            {event.resources && event.resources.length > 0 && (
                                <>
                                    <Divider />
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="lg" fontWeight="bold">Recursos</Text>
                                        {event.resources.map((resource) => (
                                            <HStack key={resource.id}>
                                                <FileText size={20} />
                                                <Text>{resource.name} ({resource.quantity})</Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </>
                            )}
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    );
} 