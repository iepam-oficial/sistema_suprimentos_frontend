'use client'

import {
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    HStack,
    Heading,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/navigation'
import {
    fetchLocales,
    fetchLocations,
    createLocale,
    updateLocale,
    deleteLocale,
    RateLimitError,
    type LocaleDTO,
    type LocationDTO,
} from '@/features/reference-data'

export default function LocationSettings() {
    const [locations, setLocations] = useState<LocaleDTO[]>([])
    const [branches, setBranches] = useState<LocationDTO[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingLocation, setEditingLocation] = useState<LocaleDTO | null>(null)
    const toast = useToast()
    const { isOpen: isLocationModalOpen, onOpen: onLocationModalOpen, onClose: onLocationModalClose } = useDisclosure()
    const router = useRouter();
    const [locationFormData, setLocationFormData] = useState({
        name: '',
        description: '',
        location_id: ''
    })

    useEffect(() => {
        loadLocales()
        loadBranches()
    }, [])

    const loadLocales = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            const data = await fetchLocales(token)
            setLocations(data)
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os locais.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const loadBranches = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }
            const data = await fetchLocations(token)
            setBranches(data)
        } catch (error) {
            if (error instanceof RateLimitError) {
                router.push('/rate-limit')
                return
            }
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as localizações.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleLocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            if (editingLocation) {
                await updateLocale(token, editingLocation.id, locationFormData)

                toast({
                    title: 'Sucesso',
                    description: 'Local atualizado com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            } else {
                await createLocale(token, locationFormData)

                toast({
                    title: 'Sucesso',
                    description: 'Local criado com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            }

            loadLocales()
            handleLocationClose()
        } catch (error) {
            if (error instanceof RateLimitError) {
                router.push('/rate-limit')
                return
            }
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar o local.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleLocationDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este local?')) {
            return
        }

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            await deleteLocale(token, id)

            toast({
                title: 'Sucesso',
                description: 'Local excluído com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            loadLocales()
        } catch (error) {
            if (error instanceof RateLimitError) {
                router.push('/rate-limit')
                return
            }
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir o local.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleLocationEdit = (location: LocaleDTO) => {
        setEditingLocation(location)
        setLocationFormData({
            name: location.name,
            description: location.description ?? '',
            location_id: location.location?.id || location.location_id || ''
        })
        onLocationModalOpen()
    }

    const handleLocationClose = () => {
        setEditingLocation(null)
        setLocationFormData({
            name: '',
            description: '',
            location_id: ''
        })
        onLocationModalClose()
    }

    return (
        <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
                <Heading size="sm">Ambientes</Heading>
                <Button colorScheme="blue" onClick={onLocationModalOpen}>
                    Novo Ambiente
                </Button>
            </HStack>

            <Table variant="striped">
                <Thead>
                    <Tr>
                        <Th>Nome</Th>
                        <Th>Descrição</Th>
                        <Th>Polo</Th>
                        <Th width="100px">Ações</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {locations.map((location) => (
                        <Tr key={location.id}>
                            <Td>{location.name}</Td>
                            <Td>{location.description}</Td>
                            <Td>{location.location?.name || '-'}</Td>
                            <Td>
                                <HStack spacing={2}>
                                    <IconButton
                                        aria-label="Excluir local"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => handleLocationDelete(location.id)}
                                    />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <Modal isOpen={isLocationModalOpen} onClose={handleLocationClose}>
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleLocationSubmit}>
                        <ModalHeader>
                            {editingLocation ? 'Editar' : 'Novo'} Ambiente
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Nome do Ambiente</FormLabel>
                                    <Input
                                        value={locationFormData.name}
                                        onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                                        placeholder="Nome do ambiente"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Descrição</FormLabel>
                                    <Input
                                        value={locationFormData.description}
                                        onChange={(e) => setLocationFormData({ ...locationFormData, description: e.target.value })}
                                        placeholder="Descrição do ambiente"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Polo</FormLabel>
                                    <select
                                        value={locationFormData.location_id}
                                        onChange={e => setLocationFormData({ ...locationFormData, location_id: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                                    >
                                        <option value="">Selecione o polo</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={handleLocationClose}>
                                Cancelar
                            </Button>
                            <Button
                                colorScheme="blue"
                                type="submit"
                                isLoading={isLoading}
                            >
                                {editingLocation ? 'Atualizar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </VStack>
    )
} 