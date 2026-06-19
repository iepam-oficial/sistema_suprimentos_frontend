import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Select,
    useToast,
    Image,
    Box,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
} from '@chakra-ui/react';
import { Supply as BaseSupply, Category } from '../utils/types';
import { initializeFormData } from '../utils/suppliesUtils';
import { uploadImage } from '@/features/images/api/imageApi';
import { fetchUnits } from '@/utils/apiUtils';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { handleImageChange } from '@/utils/imageUtils';
import { Image as ImageIcon } from 'lucide-react';
import { ImageSourceDialog } from './ImageSourceDialog';
import { fetchSubcategoriesByCategory, type SubcategoryDTO } from '@/features/reference-data';
import type { CreateSupplyInput } from '@/features/catalog/types';

type Supply = BaseSupply;

interface SupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateSupplyInput) => void;
    categories: Category[];
    initialData?: Supply;
}

export function SupplyModal({ isOpen, onClose, onSubmit, categories, initialData }: SupplyModalProps) {
    const [units, setUnits] = useState<{ id: string; name: string; symbol: string }[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [formData, setFormData] = useState<{ [key: string]: string | number }>(initializeFormData(initialData));
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [subcategories, setSubcategories] = useState<SubcategoryDTO[]>([]);
    const toast = useToast();
    const inputFileRef = useRef<HTMLInputElement | null>(null);
    const [fileCapture, setFileCapture] = useState<'environment' | 'user' | undefined>(undefined);
    const [showImageChoice, setShowImageChoice] = useState(false);
    const leastDestructiveRef = useRef<HTMLButtonElement>(null);

    const loadSubcategories = useCallback(async (categoryId: string) => {
        if (!categoryId) {
            setSubcategories([]);
            return;
        }
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) return;
            const data = await fetchSubcategoriesByCategory(token, categoryId);
            setSubcategories(data);
        } catch {
            setSubcategories([]);
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(initializeFormData(initialData));
            if (initialData.image_url) {
                setPreviewUrl(initialData.image_url);
            }
            if (initialData.category?.id) {
                loadSubcategories(initialData.category.id);
            }
        } else {
            setFormData(initializeFormData());
            setPreviewUrl('');
            setSubcategories([]);
        }
    }, [initialData, loadSubcategories]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [unitsData, chartOfAccountsData] = await Promise.all([
                    fetchUnits(),
                    fetchChartOfAccounts('ATIVO'),
                ]);
                setUnits(unitsData);
                setChartOfAccounts(chartOfAccountsData);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                toast({
                    title: 'Erro ao carregar dados',
                    description: 'Não foi possível carregar os dados necessários.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        };
        if (isOpen) {
            loadData();
        }
    }, [toast, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.chart_of_account_id) {
            toast({
                title: 'Campo obrigatório',
                description: 'Plano de conta é obrigatório',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            let imageUrl = String(formData.image_url || '');

            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            const payload: CreateSupplyInput = {
                name: String(formData.name),
                description: formData.description ? String(formData.description) : undefined,
                minimum_quantity: Number(formData.minimum_quantity),
                unit_id: String(formData.unit_id),
                category_id: String(formData.category_id),
                subcategory_id: formData.subcategory_id ? String(formData.subcategory_id) : undefined,
                image_url: imageUrl || undefined,
                chart_of_account_id: String(formData.chart_of_account_id),
            };

            onSubmit(payload);
            setFormData(initializeFormData());
            setSelectedImage(null);
            setPreviewUrl('');
            onClose();
        } catch {
            toast({
                title: 'Erro ao fazer upload da imagem',
                description: 'Não foi possível fazer o upload da imagem.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent
                maxW={{ base: '95vw', md: '900px' }}
                aspectRatio={{ base: undefined, md: '16/9' }}
                mx={{ base: 2, md: 'auto' }}
            >
                <form onSubmit={handleSubmit}>
                    <ModalHeader>
                        {initialData ? 'Editar Suprimento' : 'Novo Suprimento'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box
                            display={{ base: 'block', md: 'grid' }}
                            gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
                            gap={4}
                        >
                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Nome</FormLabel>
                                <Input
                                    value={String(formData.name)}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome do suprimento"
                                />
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '2' }}>
                                <FormLabel>Descrição</FormLabel>
                                <Input
                                    value={String(formData.description)}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição do suprimento"
                                />
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Quantidade Mínima</FormLabel>
                                <NumberInput
                                    min={0}
                                    value={formData.minimum_quantity}
                                    onChange={(_, value) => setFormData({ ...formData, minimum_quantity: value })}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '2' }}>
                                <FormLabel>Unidade de Medida</FormLabel>
                                <Select
                                    value={String(formData.unit_id)}
                                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                                    placeholder="Selecione uma unidade"
                                >
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.symbol})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Categoria</FormLabel>
                                <Select
                                    value={String(formData.category_id)}
                                    onChange={(e) => {
                                        setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' });
                                        loadSubcategories(e.target.value);
                                    }}
                                    placeholder="Selecione uma categoria"
                                >
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl gridColumn={{ base: 'auto', md: '2' }} isDisabled={!formData.category_id}>
                                <FormLabel>Subcategoria</FormLabel>
                                <Select
                                    value={String(formData.subcategory_id || '')}
                                    onChange={e => setFormData({ ...formData, subcategory_id: e.target.value })}
                                    placeholder="Selecione uma subcategoria"
                                >
                                    {subcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Plano de Conta</FormLabel>
                                <Select
                                    value={String(formData.chart_of_account_id || '')}
                                    onChange={(e) => setFormData({ ...formData, chart_of_account_id: e.target.value })}
                                    placeholder="Selecione o plano de conta"
                                >
                                    {chartOfAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.codigo} - {account.nome}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl gridColumn={{ base: 'auto', md: '2' }}>
                                <Button
                                    mt="2vh"
                                    minW="full"
                                    leftIcon={<ImageIcon size={18} />}
                                    onClick={() => setShowImageChoice(true)}
                                    colorScheme="blue"
                                    mb={2}
                                >
                                    Carregar imagem do Produto
                                </Button>
                                <input
                                    ref={inputFileRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    capture={fileCapture ?? undefined}
                                    onChange={(e) => {
                                        handleImageChange(e, setSelectedImage, setPreviewUrl);
                                        setFileCapture(undefined);
                                    }}
                                />
                                <ImageSourceDialog
                                    isOpen={showImageChoice}
                                    onClose={() => setShowImageChoice(false)}
                                    onSelectGallery={() => {
                                        setFileCapture(undefined);
                                        setShowImageChoice(false);
                                        setTimeout(() => inputFileRef.current?.click(), 100);
                                    }}
                                    onSelectCamera={() => {
                                        setFileCapture('environment');
                                        setShowImageChoice(false);
                                        setTimeout(() => inputFileRef.current?.click(), 100);
                                    }}
                                    leastDestructiveRef={leastDestructiveRef}
                                    title="Como deseja carregar a imagem?"
                                />
                                {previewUrl && (
                                    <Box mt={2}>
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            maxH="200px"
                                            objectFit="contain"
                                        />
                                    </Box>
                                )}
                            </FormControl>
                        </Box>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button colorScheme="blue" type="submit">
                            {initialData ? 'Salvar' : 'Criar'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
