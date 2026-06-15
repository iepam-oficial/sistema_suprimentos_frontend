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
    Textarea,
    Box,
    Text,
    useColorModeValue,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons'
import { ExtraExpenseCategory } from '../../interfaces/IExtraExpenseCategory'
import {
    createExtraExpenseCategory,
    deleteExtraExpenseCategory,
    fetchExtraExpenseCategories,
    updateExtraExpenseCategory,
} from '@/features/financeiro/api/extraExpenseCategoryApi'

export default function ExtraExpenseCategories() {
    const [categories, setCategories] = useState<ExtraExpenseCategory[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ExtraExpenseCategory | null>(null)
    const toast = useToast()
    const { isOpen: isCategoryModalOpen, onOpen: onCategoryModalOpen, onClose: onCategoryModalClose } = useDisclosure()

    const [categoryFormData, setCategoryFormData] = useState({
        value: '',
        label: '',
        description: ''
    })

    const bgColor = useColorModeValue('white', 'gray.700')
    const borderColor = useColorModeValue('gray.200', 'gray.600')

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            const data = await fetchExtraExpenseCategories(token)
            setCategories(data)
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as categorias de gastos extras.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            if (editingCategory) {
                await updateExtraExpenseCategory(token, editingCategory.id, {
                    value: categoryFormData.value,
                    label: categoryFormData.label,
                    description: categoryFormData.description,
                })

                toast({
                    title: 'Sucesso',
                    description: 'Categoria atualizada com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            } else {
                await createExtraExpenseCategory(token, {
                    value: categoryFormData.value,
                    label: categoryFormData.label,
                    description: categoryFormData.description,
                })

                toast({
                    title: 'Sucesso',
                    description: 'Categoria criada com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            }

            fetchCategories()
            handleCategoryClose()
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar a categoria.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCategoryDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
            return
        }

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            await deleteExtraExpenseCategory(token, id)

            toast({
                title: 'Sucesso',
                description: 'Categoria excluída com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            fetchCategories()
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a categoria.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleCategoryEdit = (category: ExtraExpenseCategory) => {
        setEditingCategory(category)
        setCategoryFormData({
            value: category.value,
            label: category.label,
            description: category.description || ''
        })
        onCategoryModalOpen()
    }

    const handleCategoryClose = () => {
        setEditingCategory(null)
        setCategoryFormData({ value: '', label: '', description: '' })
        onCategoryModalClose()
    }

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <HStack justify="space-between" mb={4}>
                    <Heading size="md">Categorias de Gastos Extras</Heading>
                    <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        onClick={onCategoryModalOpen}
                        size="sm"
                    >
                        Nova Categoria
                    </Button>
                </HStack>

                <Box
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    overflow="hidden"
                >
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Nome</Th>
                                <Th>Descrição</Th>
                                <Th>Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {categories.length > 0 && categories.map((category) => (
                                <Tr key={category.id}>
                                    <Td>
                                        <Text fontWeight="medium">
                                            {category.label}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm" color="gray.500" noOfLines={2}>
                                            {category.description || '-'}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <HStack spacing={2}>
                                            <IconButton
                                                aria-label="Editar categoria"
                                                icon={<EditIcon />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleCategoryEdit(category)}
                                            />
                                            <IconButton
                                                aria-label="Excluir categoria"
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => handleCategoryDelete(category.id)}
                                            />
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </Box>

            {/* Modal de Categoria */}
            <Modal isOpen={isCategoryModalOpen} onClose={handleCategoryClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={handleCategorySubmit}>
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Nome</FormLabel>
                                    <Input
                                        value={categoryFormData.label}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, label: e.target.value })}
                                        placeholder="Ex: Combustível, Aluguel, Limpeza"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Código</FormLabel>
                                    <Input
                                        value={categoryFormData.value}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                                        placeholder="Ex: fuel, rental, cleaning"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Descrição</FormLabel>
                                    <Textarea
                                        value={categoryFormData.description}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                        placeholder="Descrição opcional da categoria"
                                        rows={3}
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={handleCategoryClose}>
                                Cancelar
                            </Button>
                            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
                                {editingCategory ? 'Atualizar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </VStack>
    )
} 