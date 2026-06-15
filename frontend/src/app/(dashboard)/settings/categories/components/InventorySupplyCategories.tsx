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
    Box,
    Text,
    Badge,
    useColorModeValue,
    Select,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons'
import {
    fetchCategories,
    fetchSubcategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    type CategoryDTO,
    type SubcategoryDTO,
} from '@/features/reference-data'

type CategoryWithSubcategories = CategoryDTO & { subcategories?: SubcategoryDTO[] }

export default function InventorySupplyCategories() {
    const [categories, setCategories] = useState<CategoryWithSubcategories[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryWithSubcategories | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryDTO | null>(null)
    const toast = useToast()
    const { isOpen: isCategoryModalOpen, onOpen: onCategoryModalOpen, onClose: onCategoryModalClose } = useDisclosure()
    const { isOpen: isSubcategoryModalOpen, onOpen: onSubcategoryModalOpen, onClose: onSubcategoryModalClose } = useDisclosure()

    const [categoryFormData, setCategoryFormData] = useState({
        value: '',
        subcategoryValue: ''
    })

    const [subcategoryFormData, setSubcategoryFormData] = useState({
        value: '',
        categoryId: ''
    })

    const bgColor = useColorModeValue('white', 'gray.700')
    const borderColor = useColorModeValue('gray.200', 'gray.600')

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            const [categoriesData, subcategoriesData] = await Promise.all([
                fetchCategories(token),
                fetchSubcategories(token),
            ])

            setCategories(
                categoriesData.map((cat) => ({
                    ...cat,
                    subcategories: subcategoriesData.filter((sub) => sub.category_id === cat.id),
                }))
            )
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as categorias.',
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
                await updateCategory(token, editingCategory.id, {
                    value: categoryFormData.value,
                    label: categoryFormData.value,
                })

                toast({
                    title: 'Sucesso',
                    description: 'Categoria atualizada com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            } else {
                const category = await createCategory(token, {
                    value: categoryFormData.value,
                    label: categoryFormData.value,
                })

                if (categoryFormData.subcategoryValue) {
                    await createSubcategory(token, {
                        value: categoryFormData.subcategoryValue,
                        label: categoryFormData.subcategoryValue,
                        category_id: category.id,
                    })
                }

                toast({
                    title: 'Sucesso',
                    description: 'Categoria e subcategoria criadas com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })
            }

            loadCategories()
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

    const handleSubcategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            const payload = {
                value: subcategoryFormData.value,
                label: subcategoryFormData.value,
                category_id: subcategoryFormData.categoryId,
            }

            if (editingSubcategory) {
                await updateSubcategory(token, editingSubcategory.id, payload)
            } else {
                await createSubcategory(token, payload)
            }

            toast({
                title: 'Sucesso',
                description: editingSubcategory
                    ? 'Subcategoria atualizada com sucesso.'
                    : 'Subcategoria criada com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            loadCategories()
            handleSubcategoryClose()
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar a subcategoria.',
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

            await deleteCategory(token, id)

            toast({
                title: 'Sucesso',
                description: 'Categoria excluída com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            loadCategories()
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

    const handleSubcategoryDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) {
            return
        }

        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado')
            }

            await deleteSubcategory(token, id)

            toast({
                title: 'Sucesso',
                description: 'Subcategoria excluída com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            loadCategories()
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a subcategoria.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const handleCategoryEdit = (category: CategoryWithSubcategories) => {
        setEditingCategory(category)
        setCategoryFormData({
            value: category.value,
            subcategoryValue: ''
        })
        onCategoryModalOpen()
    }

    const handleEditSubcategory = (subcategory: SubcategoryDTO) => {
        setEditingSubcategory(subcategory)
        setSubcategoryFormData({
            value: subcategory.value,
            categoryId: subcategory.category_id
        })
        onSubcategoryModalOpen()
    }

    const handleCategoryClose = () => {
        setEditingCategory(null)
        setCategoryFormData({ value: '', subcategoryValue: '' })
        onCategoryModalClose()
    }

    const handleSubcategoryClose = () => {
        setEditingSubcategory(null)
        setSubcategoryFormData({ value: '', categoryId: '' })
        onSubcategoryModalClose()
    }

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <HStack justify="space-between" mb={4}>
                    <Heading size="md">Categorias de Inventário e Suprimentos</Heading>
                    <HStack>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={onCategoryModalOpen}
                            size="sm"
                        >
                            Nova Categoria
                        </Button>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="green"
                            onClick={() => {
                                setSubcategoryFormData({ value: '', categoryId: '' })
                                onSubcategoryModalOpen()
                            }}
                            size="sm"
                        >
                            Nova Subcategoria
                        </Button>
                    </HStack>
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
                                <Th>Categoria</Th>
                                <Th>Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {categories.map((category) => (
                                <Tr key={category.id}>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="medium">{category.label}</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                {category.value}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            {category.subcategories?.map((subcategory: SubcategoryDTO) => (
                                                <HStack key={subcategory.id} spacing={2}>
                                                    <Badge colorScheme="blue" variant="subtle">
                                                        {subcategory.label}
                                                    </Badge>
                                                    <IconButton
                                                        aria-label="Editar subcategoria"
                                                        icon={<EditIcon />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => handleEditSubcategory(subcategory)}
                                                    />
                                                    <IconButton
                                                        aria-label="Excluir subcategoria"
                                                        icon={<DeleteIcon />}
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={() => handleSubcategoryDelete(subcategory.id)}
                                                    />
                                                </HStack>
                                            ))}
                                        </VStack>
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
                                    <FormLabel>Nome da Categoria</FormLabel>
                                    <Input
                                        value={categoryFormData.value}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                                        placeholder="Ex: Equipamentos de Informática"
                                    />
                                </FormControl>
                                {!editingCategory && (
                                    <FormControl>
                                        <FormLabel>Subcategoria (opcional)</FormLabel>
                                        <Input
                                            value={categoryFormData.subcategoryValue}
                                            onChange={(e) => setCategoryFormData({ ...categoryFormData, subcategoryValue: e.target.value })}
                                            placeholder="Ex: Computadores"
                                        />
                                    </FormControl>
                                )}
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

            <Modal isOpen={isSubcategoryModalOpen} onClose={handleSubcategoryClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={handleSubcategorySubmit}>
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select
                                        value={subcategoryFormData.categoryId}
                                        onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, categoryId: e.target.value })}
                                        placeholder="Selecione uma categoria"
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Nome da Subcategoria</FormLabel>
                                    <Input
                                        value={subcategoryFormData.value}
                                        onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, value: e.target.value })}
                                        placeholder="Ex: Computadores Desktop"
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={handleSubcategoryClose}>
                                Cancelar
                            </Button>
                            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
                                {editingSubcategory ? 'Atualizar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </VStack>
    )
}
