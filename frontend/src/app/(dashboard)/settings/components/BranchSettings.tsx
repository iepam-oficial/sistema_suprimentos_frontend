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
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    RateLimitError,
    type LocationDTO,
} from '@/features/reference-data'

export default function BranchSettings() {
    const [branches, setBranches] = useState<LocationDTO[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingBranch, setEditingBranch] = useState<LocationDTO | null>(null)
    const toast = useToast()
    const { isOpen: isBranchModalOpen, onOpen: onBranchModalOpen, onClose: onBranchModalClose } = useDisclosure()
    const router = useRouter();

    const [branchFormData, setBranchFormData] = useState({
        name: '',
        address: '',
        branch: ''
    })

    useEffect(() => {
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
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

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            if (editingBranch) {
                await updateLocation(token, editingBranch.id, branchFormData)

                toast({
                    title: 'Sucesso',
                    description: 'Localização atualizada com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            } else {
                await createLocation(token, branchFormData)

                toast({
                    title: 'Sucesso',
                    description: 'Localização criada com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            }

            fetchBranches()
            handleBranchClose()
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar a localização.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleBranchDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta localização?')) {
            return
        }

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            await deleteLocation(token, id)

            toast({
                title: 'Sucesso',
                description: 'Localização excluída com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            fetchBranches()
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a localização.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleBranchEdit = (branch: LocationDTO) => {
        setEditingBranch(branch)
        setBranchFormData({
            name: branch.name,
            address: branch.address ?? '',
            branch: branch.branch ?? ''
        })
        onBranchModalOpen()
    }

    const handleBranchClose = () => {
        setEditingBranch(null)
        setBranchFormData({
            name: '',
            address: '',
            branch: ''
        })
        onBranchModalClose()
    }

    return (
        <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
                <Heading size="sm">Polos</Heading>
                <Button colorScheme="blue" onClick={onBranchModalOpen}>
                    Novo Polo
                </Button>
            </HStack>

            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Nome</Th>
                        <Th>Endereço</Th>
                        <Th>Polo</Th>
                        <Th width="100px">Ações</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {branches.map((branch) => (
                        <Tr key={branch.id}>
                            <Td>{branch.name}</Td>
                            <Td>{branch.address}</Td>
                            <Td>{branch.branch}</Td>
                            <Td>
                                <HStack spacing={2}>
                                    <IconButton
                                        aria-label="Editar localização"
                                        icon={<EditIcon />}
                                        size="sm"
                                        onClick={() => handleBranchEdit(branch)}
                                    />
                                    <IconButton
                                        aria-label="Excluir localização"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => handleBranchDelete(branch.id)}
                                    />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <Modal isOpen={isBranchModalOpen} onClose={handleBranchClose}>
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleBranchSubmit}>
                        <ModalHeader>
                            {editingBranch ? 'Editar' : 'Novo'} Polo
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Nome</FormLabel>
                                    <Input
                                        value={branchFormData.name}
                                        onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                                        placeholder="Nome da localização"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Endereço</FormLabel>
                                    <Input
                                        value={branchFormData.address}
                                        onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                                        placeholder="Endereço do polo"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Polo</FormLabel>
                                    <Input
                                        value={branchFormData.branch}
                                        onChange={(e) => setBranchFormData({ ...branchFormData, branch: e.target.value })}
                                        placeholder="Nome do polo"
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={handleBranchClose}>
                                Cancelar
                            </Button>
                            <Button
                                colorScheme="blue"
                                type="submit"
                                isLoading={isLoading}
                            >
                                {editingBranch ? 'Atualizar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </VStack>
    )
} 