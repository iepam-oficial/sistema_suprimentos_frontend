'use client'

import {
    VStack,
    FormControl,
    FormLabel,
    FormHelperText,
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
    Text,
    Badge,
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
import { formatCnpjMask } from '@/utils/formatCnpjMask'

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
        branch: '',
        cnpj: '',
        legal_name: '',
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

            const payload = {
                ...branchFormData,
                cnpj: branchFormData.cnpj.trim() === '' ? null : branchFormData.cnpj,
                legal_name: branchFormData.legal_name.trim() === '' ? null : branchFormData.legal_name,
            }

            if (editingBranch) {
                await updateLocation(token, editingBranch.id, payload)

                toast({
                    title: 'Sucesso',
                    description: 'Localização atualizada com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            } else {
                await createLocation(token, payload)

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
            const description =
                error instanceof Error && error.message
                    ? error.message
                    : 'Não foi possível salvar a localização.'
            toast({
                title: 'Erro',
                description,
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
            branch: branch.branch ?? '',
            cnpj: branch.cnpj ?? '',
            legal_name: branch.legal_name ?? '',
        })
        onBranchModalOpen()
    }

    const handleBranchClose = () => {
        setEditingBranch(null)
        setBranchFormData({
            name: '',
            address: '',
            branch: '',
            cnpj: '',
            legal_name: '',
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
                            <Td>
                                <Text>{branch.name}</Text>
                                {branch.cnpj ? (
                                    <Text fontSize="sm" color="gray.500">{branch.cnpj}</Text>
                                ) : (
                                    <Badge colorScheme="orange" variant="subtle" size="sm">Sem CNPJ</Badge>
                                )}
                            </Td>
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

                                <Text fontWeight="medium" alignSelf="flex-start" pt={2}>
                                    Dados da empresa
                                </Text>
                                <FormControl>
                                    <FormLabel>CNPJ</FormLabel>
                                    <Input
                                        value={branchFormData.cnpj}
                                        onChange={(e) => setBranchFormData({
                                            ...branchFormData,
                                            cnpj: formatCnpjMask(e.target.value),
                                        })}
                                        placeholder="00.000.000/0000-00"
                                    />
                                    {branchFormData.cnpj.trim() === '' && (
                                        <FormHelperText color="orange.500">
                                            CNPJ não informado
                                        </FormHelperText>
                                    )}
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Razão social</FormLabel>
                                    <Input
                                        value={branchFormData.legal_name}
                                        onChange={(e) => setBranchFormData({
                                            ...branchFormData,
                                            legal_name: e.target.value,
                                        })}
                                        placeholder="Razão social da empresa"
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
