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
    Text,
    Badge,
    SimpleGrid,
} from '@chakra-ui/react';
import type { Supply, CreateSupplyInput } from '@/features/catalog/types';
import { initializeFormData } from '@/features/catalog/utils/supplyForm';
import { uploadImage } from '@/features/images/api/imageApi';
import { fetchUnits } from '@/utils/apiUtils';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { handleImageChange } from '@/utils/imageUtils';
import { Image as ImageIcon } from 'lucide-react';
import { ImageSourceDialog } from '@/features/catalog/components/ImageSourceDialog';
import { SupplyInternalCodeDisplay } from '@/features/catalog/components/SupplyInternalCodeDisplay';
import { fetchSubcategoriesByCategory, type CategoryDTO, type SubcategoryDTO } from '@/features/reference-data';
import {
    abcBadgeColorScheme,
    abcBadgeLabel,
    formatAbcDisplay,
} from '@/features/catalog/abcClassification';
import { formatBRL } from '@/utils/money';

interface SupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateSupplyInput) => void | Promise<void>;
    categories: CategoryDTO[];
    initialData?: Supply;
    /** Pré-preenche campos ao abrir modal de criação */
    prefill?: {
        name?: string;
        description?: string;
    };
    onInternalCodeGenerated?: (supply: Supply) => void;
}

function formatAbcPercent(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function formatAbcDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('pt-BR');
}

function formatAbcPeriodValue(value: number | null | undefined): string {
    if (value == null) return '—';
    return formatBRL(value);
}

function buildCreateFormData(prefill?: SupplyModalProps['prefill']) {
    const base = initializeFormData();
    return {
        ...base,
        name: prefill?.name ?? base.name,
        description: prefill?.description ?? base.description,
    };
}

export function SupplyModal({ isOpen, onClose, onSubmit, categories, initialData, prefill, onInternalCodeGenerated }: SupplyModalProps) {
    const [units, setUnits] = useState<{ id: string; name: string; symbol: string }[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [formData, setFormData] = useState<{ [key: string]: string | number }>(
        () => (initialData ? initializeFormData(initialData) : buildCreateFormData(prefill))
    );
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [subcategories, setSubcategories] = useState<SubcategoryDTO[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalCode, setInternalCode] = useState(initialData?.internal_code ?? null);
    const toast = useToast();
    const inputFileRef = useRef<HTMLInputElement | null>(null);
    const [fileCapture, setFileCapture] = useState<'environment' | 'user' | undefined>(undefined);
    const [showImageChoice, setShowImageChoice] = useState(false);
    const leastDestructiveRef = useRef<HTMLButtonElement>(null);
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('@ti-assistant:token') || '' : '';

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
            setInternalCode(initialData.internal_code ?? null);
            if (initialData.image_url) {
                setPreviewUrl(initialData.image_url);
            }
            if (initialData.category?.id) {
                loadSubcategories(initialData.category.id);
            }
        } else {
            setFormData(buildCreateFormData(prefill));
            setInternalCode(null);
            setPreviewUrl('');
            setSubcategories([]);
        }
    }, [initialData, prefill?.name, prefill?.description, loadSubcategories]);

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

        setIsSubmitting(true);
        try {
            let imageUrl = String(formData.image_url || '');

            if (selectedImage) {
                try {
                    const uploaded = await uploadImage(selectedImage);
                    imageUrl = uploaded.key;
                    setPreviewUrl(uploaded.url);
                } catch {
                    toast({
                        title: 'Erro ao fazer upload da imagem',
                        description: 'Não foi possível fazer o upload da imagem.',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    return;
                }
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

            await onSubmit(payload);
            setFormData(initializeFormData());
            setSelectedImage(null);
            setPreviewUrl('');
            onClose();
        } catch (error) {
            toast({
                title: 'Erro ao salvar',
                description: error instanceof Error ? error.message : 'Não foi possível salvar o suprimento.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
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

                            {initialData && authToken && (
                                <Box gridColumn="1 / -1">
                                    <SupplyInternalCodeDisplay
                                        supplyId={initialData.id}
                                        internalCode={internalCode}
                                        token={authToken}
                                        variant="modal"
                                        onGenerated={(dto) => {
                                            setInternalCode(dto.internal_code ?? null);
                                            onInternalCodeGenerated?.(dto as Supply);
                                        }}
                                    />
                                </Box>
                            )}

                            {initialData && (
                                <Box
                                    gridColumn="1 / -1"
                                    borderWidth="1px"
                                    borderRadius="md"
                                    p={3}
                                >
                                    <Text fontWeight="semibold" mb={2} fontSize="sm">
                                        Classificação ABC
                                    </Text>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                        <FormControl>
                                            <FormLabel fontSize="sm">Classe</FormLabel>
                                            {initialData.abc_classification != null ? (
                                                <Badge
                                                    colorScheme={abcBadgeColorScheme(initialData.abc_classification)}
                                                >
                                                    {abcBadgeLabel(initialData.abc_classification)}
                                                </Badge>
                                            ) : (
                                                <Text fontSize="sm">{formatAbcDisplay(null)}</Text>
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm">Valor de consumo (período)</FormLabel>
                                            <Text fontSize="sm">
                                                {formatAbcPeriodValue(initialData.abc_period_value)}
                                            </Text>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm">Percentual acumulado</FormLabel>
                                            <Text fontSize="sm">
                                                {formatAbcPercent(initialData.abc_cumulative_percent)}
                                            </Text>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm">Última classificação</FormLabel>
                                            <Text fontSize="sm">
                                                {formatAbcDate(initialData.abc_classified_at)}
                                            </Text>
                                        </FormControl>
                                    </SimpleGrid>
                                </Box>
                            )}

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
                        <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
                            {initialData ? 'Salvar' : 'Criar'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
