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
    Select,
    Badge,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/navigation'
import {
    fetchSectors,
    fetchLocations,
    createSector,
    updateSector,
    deleteSector,
    RateLimitError,
    type LocationDTO,
    type SectorWithCountDTO,
} from '@/features/reference-data'

export default function SectorSettings() {
    const [sectors, setSectors] = useState<SectorWithCountDTO[]>([])
    const [locations, setLocations] = useState<LocationDTO[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingSector, setEditingSector] = useState<SectorWithCountDTO | null>(null)
    const toast = useToast()
    const { isOpen: isSectorModalOpen, onOpen: onSectorModalOpen, onClose: onSectorModalClose } = useDisclosure()
    const router = useRouter();
    const [sectorFormData, setSectorFormData] = useState({
        name: '',
        description: '',
        location_id: ''
    })

    useEffect(() => {
        loadSectors()
        loadLocations()
    }, [])

    const loadSectors = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            const data = await fetchSectors(token)
            setSectors(data as SectorWithCountDTO[])
        } catch (error) {
            if (error instanceof RateLimitError) {
                router.push('/rate-limit')
                return
            }
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os setores.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const loadLocations = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            const data = await fetchLocations(token)
            console.log('Locations data:', data) // Debug log
            setLocations(data)
        } catch (error) {
            console.error('Erro ao carregar localizações:', error) // Debug log
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as localizações.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleSectorSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            if (editingSector) {
                await updateSector(token, editingSector.id, sectorFormData)

                toast({
                    title: 'Sucesso',
                    description: 'Setor atualizado com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            } else {
                await createSector(token, sectorFormData)

                toast({
                    title: 'Sucesso',
                    description: 'Setor criado com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            }

            loadSectors()
            handleSectorClose()
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Não foi possível salvar o setor.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSectorDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este setor?')) {
            return
        }

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            await deleteSector(token, id)

            toast({
                title: 'Sucesso',
                description: 'Setor excluído com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            loadSectors()
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Não foi possível excluir o setor.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleSectorEdit = (sector: SectorWithCountDTO) => {
        setEditingSector(sector)
        setSectorFormData({
            name: sector.name,
            description: sector.description || '',
            location_id: sector.location_id
        })
        onSectorModalOpen()
    }

    const handleSectorClose = () => {
        setEditingSector(null)
        setSectorFormData({
            name: '',
            description: '',
            location_id: ''
        })
        onSectorModalClose()
    }

    return (
        <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
                <Heading size="sm">Setores</Heading>
                <Button colorScheme="blue" onClick={onSectorModalOpen}>
                    Novo Setor
                </Button>
            </HStack>

            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Nome</Th>
                        <Th>Descrição</Th>
                        <Th>Localização</Th>
                        <Th>Itens de Inventário</Th>
                        <Th width="100px">Ações</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {sectors.length > 0 && sectors.map((sector) => (
                        <Tr key={sector.id}>
                            <Td>{sector.name}</Td>
                            <Td>{sector.description || '-'}</Td>
                            <Td>{sector.location?.name || '-'}</Td>
                            <Td>
                                <Badge colorScheme={sector._count?.inventory && sector._count.inventory > 0 ? 'green' : 'gray'}>
                                    {sector._count?.inventory ?? 0} itens
                                </Badge>
                            </Td>
                            <Td>
                                <HStack spacing={2}>
                                    <IconButton
                                        aria-label="Editar setor"
                                        icon={<EditIcon />}
                                        size="sm"
                                        onClick={() => handleSectorEdit(sector)}
                                    />
                                    <IconButton
                                        aria-label="Excluir setor"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => handleSectorDelete(sector.id)}
                                        isDisabled={!!sector._count?.inventory && sector._count.inventory > 0}
                                    />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <Modal isOpen={isSectorModalOpen} onClose={handleSectorClose}>
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleSectorSubmit}>
                        <ModalHeader>
                            {editingSector ? 'Editar' : 'Novo'} Setor
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Nome do Setor</FormLabel>
                                    <Input
                                        value={sectorFormData.name}
                                        onChange={(e) => setSectorFormData({ ...sectorFormData, name: e.target.value })}
                                        placeholder="Nome do setor"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Descrição</FormLabel>
                                    <Input
                                        value={sectorFormData.description}
                                        onChange={(e) => setSectorFormData({ ...sectorFormData, description: e.target.value })}
                                        placeholder="Descrição do setor"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Localização</FormLabel>
                                    <Select
                                        value={sectorFormData.location_id}
                                        onChange={(e) => setSectorFormData({ ...sectorFormData, location_id: e.target.value })}
                                        placeholder="Selecione uma localização"
                                    >
                                        {locations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={handleSectorClose}>
                                Cancelar
                            </Button>
                            <Button
                                colorScheme="blue"
                                type="submit"
                                isLoading={isLoading}
                            >
                                {editingSector ? 'Atualizar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </VStack>
    )
} 