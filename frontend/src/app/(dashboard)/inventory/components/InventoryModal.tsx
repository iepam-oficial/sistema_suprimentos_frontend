'use client'

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    FormErrorMessage,
    VStack,
    HStack,
    SimpleGrid,
    Stack,
    useToast,
    Box,
    Image,
    ButtonGroup,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { uploadImage } from '@/features/images/api/imageApi'
import { handleImageChange } from '@/utils/imageUtils'
import formatCurrency from '../utils/formatCurrency'
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import {
    fetchLocations,
    fetchCategories,
    fetchLocales,
    fetchSubcategoriesByCategory,
    type CategoryDTO,
    type LocationDTO,
    type LocaleDTO,
    type SubcategoryDTO,
} from '@/features/reference-data';
import { lookupDepreciationRate } from '@/features/inventory/api/depreciationRateApi';
import type { DepreciationRateDTO } from '@ti-assistant/contracts';
import {
    DepreciationConfigFields,
    type AppliedSnapshots,
    type DepreciationFieldValues,
} from './DepreciationConfigFields';

interface InventoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    initialData?: any
    isEdit?: boolean
}

export function InventoryModal({ isOpen, onClose, onSubmit, initialData, isEdit }: InventoryModalProps) {
    const [formData, setFormData] = useState({
        item: '',
        name: '',
        model: '',
        serial_number: '',
        finality: '',
        acquisition_price: '',
        freight: '',
        acquisition_date: '',
        location_id: '',
        locale_id: '',
        category_id: '',
        subcategory_id: '',
        supplier_id: '',
        description: '',
        status: 'STANDBY',
        image_url: '',
        residual_value: '',
        service_life: '',
        chart_of_account_id: '',
        ncm: '',
        cest: '',
        annual_rate: '',
        override_reason: '',
    })

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; label: string }[]>([])
    const [subcategories, setSubcategories] = useState<{ id: string; label: string }[]>([])
    const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
    const [locales, setLocales] = useState<LocaleDTO[]>([])
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const toast = useToast()
    const [isDepreciable, setIsDepreciable] = useState(false);
    const [lookedUpRate, setLookedUpRate] = useState<DepreciationRateDTO | null>(null);
    const [lookupNotFound, setLookupNotFound] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [applyDepreciationRateId, setApplyDepreciationRateId] = useState<string | null>(null);
    const [appliedSnapshots, setAppliedSnapshots] = useState<AppliedSnapshots | null>(null);

    const resetDepreciationSession = () => {
        setLookedUpRate(null);
        setLookupNotFound(false);
        setIsLookingUp(false);
        setApplyDepreciationRateId(null);
        setAppliedSnapshots(null);
    };

    const itemIsDepreciable = (data: any) =>
        Boolean(
            data?.ncm ||
                data?.cest ||
                (data?.annual_rate != null && Number(data.annual_rate) > 0) ||
                (data?.service_life != null && Number(data.service_life) > 0) ||
                (data?.residual_value != null && Number(data.residual_value) > 0) ||
                data?.depreciation_rate_id
        );

    const snapshotsFromItem = (data: any): AppliedSnapshots | null => {
        if (
            data?.rule_annual_rate == null &&
            data?.rule_service_life == null &&
            data?.rule_chart_of_account_id == null
        ) {
            return null;
        }
        return {
            rule_annual_rate: data.rule_annual_rate != null ? Number(data.rule_annual_rate) : null,
            rule_service_life: data.rule_service_life != null ? Number(data.rule_service_life) : null,
            rule_chart_of_account_id: data.rule_chart_of_account_id ?? null,
        };
    };

    useEffect(() => {
        if (isOpen) {
            fetchFormData();
            if (isEdit && initialData) {
                setFormData({
                    item: initialData.item || '',
                    name: initialData.name || '',
                    model: initialData.model || '',
                    serial_number: initialData.serial_number || '',
                    finality: initialData.finality || '',
                    acquisition_price: initialData.acquisition_price ? String(initialData.acquisition_price) : '',
                    freight: initialData.freight !== undefined ? String(initialData.freight) : '',
                    acquisition_date: initialData.acquisition_date ? initialData.acquisition_date.slice(0, 10) : '',
                    location_id: initialData.location?.id || '',
                    locale_id: initialData.locale?.id || '',
                    category_id: initialData.category?.id || '',
                    subcategory_id: initialData.subcategory?.id || '',
                    supplier_id: initialData.supplier_id || '',
                    description: initialData.description || '',
                    status: initialData.status || 'STANDBY',
                    image_url: initialData.image_url || '',
                    residual_value: initialData.residual_value !== undefined ? String(initialData.residual_value) : '',
                    service_life: initialData.service_life !== undefined ? String(initialData.service_life) : '',
                    chart_of_account_id: initialData.chartOfAccount?.id || initialData.chart_of_account_id || '',
                    ncm: initialData.ncm || '',
                    cest: initialData.cest || '',
                    annual_rate: initialData.annual_rate != null ? String(initialData.annual_rate) : '',
                    override_reason: initialData.override_reason || '',
                });

                if (initialData.category?.id) {
                    loadSubcategoriesForCategory(initialData.category.id);
                }
                setIsDepreciable(itemIsDepreciable(initialData));
                resetDepreciationSession();
                setAppliedSnapshots(snapshotsFromItem(initialData));
            } else {
                setFormData({
                    item: '',
                    name: '',
                    model: '',
                    serial_number: '',
                    finality: '',
                    acquisition_price: '',
                    freight: '',
                    acquisition_date: '',
                    location_id: '',
                    locale_id: '',
                    category_id: '',
                    subcategory_id: '',
                    supplier_id: '',
                    description: '',
                    status: 'STANDBY',
                    image_url: '',
                    residual_value: '',
                    service_life: '',
                    chart_of_account_id: '',
                    ncm: '',
                    cest: '',
                    annual_rate: '',
                    override_reason: '',
                });
                setIsDepreciable(false);
                resetDepreciationSession();
            }
        }
    }, [isOpen, isEdit, initialData]);

    const fetchFormData = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) throw new Error('Token não encontrado')

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }

            const [locationsData, categoriesData, suppliersRes, localesData] = await Promise.all([
                fetchLocations(token),
                fetchCategories(token),
                fetch('/api/suppliers', { headers }),
                fetchLocales(token),
            ])

            const suppliersData = await suppliersRes.json()

            setLocations(locationsData)
            setCategories(categoriesData)
            setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
            setLocales(localesData)

            // Buscar planos de contas (apenas ATIVO para inventário)
            try {
                const chartOfAccountsData = await fetchChartOfAccounts('ATIVO');
                setChartOfAccounts(chartOfAccountsData);
            } catch (error) {
                console.error('Erro ao buscar planos de contas:', error);
                setChartOfAccounts([]);
            }
        } catch (error) {
            toast({
                title: 'Erro ao carregar dados',
                description: 'Não foi possível carregar os dados do formulário.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            setLocations([])
            setCategories([])
            setSuppliers([])
            setLocales([])
        }
    }

    const handleCategoryChange = async (categoryId: string) => {
        setFormData(prev => ({ ...prev, category_id: categoryId, subcategory_id: '' }))
        
        if (categoryId) {
            try {
                const token = localStorage.getItem('@ti-assistant:token')
                if (!token) return
                const data = await fetchSubcategoriesByCategory(token, categoryId)
                setSubcategories(data)
            } catch (error) {
                setSubcategories([])
            }
        } else {
            setSubcategories([])
        }
    }

    const loadSubcategoriesForCategory = async (categoryId: string) => {
        if (categoryId) {
            try {
                const token = localStorage.getItem('@ti-assistant:token')
                if (!token) return
                const data = await fetchSubcategoriesByCategory(token, categoryId)
                setSubcategories(data)
            } catch (error) {
                setSubcategories([])
            }
        } else {
            setSubcategories([])
        }
    }

    const handleDepreciableChange = (checked: boolean) => {
        setIsDepreciable(checked);
        if (!checked) {
            resetDepreciationSession();
        }
    };

    const handleDepreciationFieldChange = (field: keyof DepreciationFieldValues, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleLookupDepreciationRate = async () => {
        const ncm = formData.ncm.trim();
        if (!ncm) {
            toast({
                title: 'NCM obrigatório',
                description: 'Informe o NCM para buscar a taxa de depreciação.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLookingUp(true);
        setLookedUpRate(null);
        setLookupNotFound(false);

        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) throw new Error('Token não encontrado');

            const cest = formData.cest.trim() || undefined;
            const onDate = formData.acquisition_date || undefined;
            const rate = await lookupDepreciationRate(token, ncm, cest, onDate);

            if (!rate) {
                setLookupNotFound(true);
                toast({
                    title: 'Regra não encontrada',
                    description: 'Nenhuma regra ativa para este NCM/CEST. Preencha os campos manualmente.',
                    status: 'info',
                    duration: 4000,
                    isClosable: true,
                });
                return;
            }

            setLookedUpRate(rate);
        } catch (error) {
            toast({
                title: 'Erro ao buscar taxa',
                description: error instanceof Error ? error.message : 'Não foi possível buscar a regra.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleApplyDepreciationRate = () => {
        if (!lookedUpRate) return;

        setFormData((prev) => ({
            ...prev,
            ncm: lookedUpRate.ncm,
            cest: lookedUpRate.cest ?? prev.cest,
            service_life: String(lookedUpRate.service_life_years),
            annual_rate: String(lookedUpRate.annual_rate),
            chart_of_account_id: lookedUpRate.chart_of_account_id,
            override_reason: '',
        }));
        setApplyDepreciationRateId(lookedUpRate.id);
        setAppliedSnapshots({
            rule_annual_rate: lookedUpRate.annual_rate,
            rule_service_life: lookedUpRate.service_life_years,
            rule_chart_of_account_id: lookedUpRate.chart_of_account_id,
        });
        setLookedUpRate(null);
        setLookupNotFound(false);

        toast({
            title: 'Regra aplicada',
            description: 'Campos preenchidos com a taxa encontrada. Você ainda pode editá-los.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.item) newErrors.item = 'Tipo de item é obrigatório'
        if (!formData.name) newErrors.name = 'Nome é obrigatório'
        if (!formData.model) newErrors.model = 'Modelo é obrigatório'
        if (!formData.serial_number) newErrors.serial_number = 'Número de série é obrigatório'
        if (!formData.finality) newErrors.finality = 'Finalidade é obrigatória'
        if (!formData.acquisition_price) {
            newErrors.acquisition_price = 'Preço de aquisição é obrigatório'
        } else {
            const price = parseFloat(formData.acquisition_price);
            if (isNaN(price) || price <= 0) {
                newErrors.acquisition_price = 'Preço de aquisição deve ser um valor válido maior que zero'
            }
        }
        if (formData.freight) {
            const freightValue = parseFloat(formData.freight);
            if (isNaN(freightValue) || freightValue < 0) {
                newErrors.freight = 'Frete deve ser um valor numérico maior ou igual a zero';
            }
        }
        if (!formData.acquisition_date) newErrors.acquisition_date = 'Data de aquisição é obrigatória'
        if (!formData.location_id) newErrors.location_id = 'Localização é obrigatória'
        if (!formData.category_id) newErrors.category_id = 'Categoria é obrigatória'
        if (!formData.subcategory_id) newErrors.subcategory_id = 'Subcategoria é obrigatória'
        if (!formData.chart_of_account_id) newErrors.chart_of_account_id = 'Plano de conta é obrigatório'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            let imageUrl = formData.image_url;

            if (selectedImage) {
                const uploaded = await uploadImage(selectedImage);
                imageUrl = uploaded.key;
            }

            const dataToSend: any = {
                ...formData,
                image_url: imageUrl,
                acquisition_price: parseFloat(formData.acquisition_price),
                freight: formData.freight ? parseFloat(formData.freight) : 0,
                acquisition_date: new Date(formData.acquisition_date).toISOString(),
                chart_of_account_id: formData.chart_of_account_id || null,
            };
            if (isDepreciable) {
                dataToSend.residual_value = formData.residual_value ? parseFloat(formData.residual_value) : 0;
                dataToSend.service_life = formData.service_life ? parseInt(formData.service_life, 10) : 1;
                dataToSend.ncm = formData.ncm.trim() || null;
                dataToSend.cest = formData.cest.trim() || null;
                if (formData.annual_rate) {
                    dataToSend.annual_rate = parseFloat(formData.annual_rate);
                }
                if (applyDepreciationRateId) {
                    dataToSend.apply_depreciation_rate_id = applyDepreciationRateId;
                }
                if (formData.override_reason.trim()) {
                    dataToSend.override_reason = formData.override_reason.trim();
                }
            } else {
                delete dataToSend.residual_value;
                delete dataToSend.service_life;
                delete dataToSend.ncm;
                delete dataToSend.cest;
                delete dataToSend.annual_rate;
                delete dataToSend.apply_depreciation_rate_id;
                delete dataToSend.override_reason;
            }
            onSubmit(dataToSend)
        } catch (error) {
            toast({
                title: 'Erro ao fazer upload da imagem',
                description: 'Não foi possível fazer o upload da imagem.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent
                maxW={{ base: '95vw', md: '900px' }}
                aspectRatio={{ base: undefined, md: '16/9' }}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
            >
                <ModalHeader>{isEdit ? 'Editar Item' : 'Novo Item'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form onSubmit={handleSubmit}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Stack spacing={4}>
                                <FormControl isInvalid={!!errors.item} isRequired>
                                    <FormLabel>Tipo de Item</FormLabel>
                                    <Select
                                        value={formData.item}
                                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                        placeholder="Selecione o tipo de item"
                                    >
                                        <option value="Impressora">Impressora</option>
                                        <option value="Computador">Computador</option>
                                        <option value="Monitor">Monitor</option>
                                        <option value="Periférico">Periférico</option>
                                        <option value="Rede">Rede</option>
                                        <option value="Outros">Outros</option>
                                    </Select>
                                    <FormErrorMessage>{errors.item}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.name} isRequired>
                                    <FormLabel>Fabricante</FormLabel>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Digite o nome do item"
                                    />
                                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.model} isRequired>
                                    <FormLabel>Modelo</FormLabel>
                                    <Input
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="Digite o modelo"
                                    />
                                    <FormErrorMessage>{errors.model}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.serial_number} isRequired>
                                    <FormLabel>Número de Série</FormLabel>
                                    <Input
                                        value={formData.serial_number}
                                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        placeholder="Digite o número de série"
                                    />
                                    <FormErrorMessage>{errors.serial_number}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.finality} isRequired>
                                    <FormLabel>Finalidade</FormLabel>
                                    <Input
                                        value={formData.finality}
                                        onChange={(e) => setFormData({ ...formData, finality: e.target.value })}
                                        placeholder="Digite a finalidade"
                                    />
                                    <FormErrorMessage>{errors.finality}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.acquisition_price} isRequired>
                                    <FormLabel>Preço de Aquisição</FormLabel>
                                    <Input
                                            value={formData.acquisition_price}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            
                                            // Permite apenas números, vírgulas e pontos
                                            const cleanValue = inputValue.replace(/[^\d,.-]/g, '');
                                            
                                            // Se o campo estiver vazio, permite limpar
                                            if (cleanValue === '') {
                                                setFormData({ ...formData, acquisition_price: '' });
                                                return;
                                            }
                                            
                                            // Converte vírgula para ponto
                                            const normalizedValue = cleanValue.replace(',', '.');
                                            
                                            // Remove pontos extras, mantendo apenas o último
                                            const parts = normalizedValue.split('.');
                                            const finalValue = parts.length > 2 
                                                ? parts[0] + '.' + parts.slice(1).join('')
                                                : normalizedValue;
                                            
                                            setFormData({ ...formData, acquisition_price: finalValue });
                                        }}
                                        placeholder="0,00"
                                        onBlur={(e) => {
                                            // Formata o valor quando o campo perde o foco
                                            if (formData.acquisition_price && formData.acquisition_price !== '') {
                                                const numValue = parseFloat(formData.acquisition_price);
                                                if (!isNaN(numValue)) {
                                                    setFormData({ ...formData, acquisition_price: numValue.toString() });
                                                }
                                            }
                                        }}
                                    />
                                    {formData.acquisition_price && (
                                        <Box mt={1} fontSize="sm" color="gray.500">
                                            Valor: {formatCurrency(formData.acquisition_price)}
                                        </Box>
                                    )}
                                    <FormErrorMessage>{errors.acquisition_price}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.freight}>
                                    <FormLabel>Frete</FormLabel>
                                    <Input
                                        value={formData.freight}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            // Permite apenas números, vírgulas e pontos
                                            const cleanValue = inputValue.replace(/[^\d,.-]/g, '');
                                            if (cleanValue === '') {
                                                setFormData({ ...formData, freight: '' });
                                                return;
                                            }
                                            const normalizedValue = cleanValue.replace(',', '.');
                                            const parts = normalizedValue.split('.');
                                            const finalValue = parts.length > 2 
                                                ? parts[0] + '.' + parts.slice(1).join('')
                                                : normalizedValue;
                                            setFormData({ ...formData, freight: finalValue });
                                        }}
                                        placeholder="0,00"
                                        onBlur={() => {
                                            if (formData.freight && formData.freight !== '') {
                                                const numValue = parseFloat(formData.freight);
                                                if (!isNaN(numValue)) {
                                                    setFormData({ ...formData, freight: numValue.toString() });
                                                }
                                            }
                                        }}
                                    />
                                    {formData.freight && (
                                        <Box mt={1} fontSize="sm" color="gray.500">
                                            Valor: {formatCurrency(formData.freight)}
                                        </Box>
                                    )}
                                    <FormErrorMessage>{errors.freight}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.acquisition_date} isRequired>
                                    <FormLabel>Data de Aquisição</FormLabel>
                                    <Input
                                        type="date"
                                        value={formData.acquisition_date}
                                        onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                                    />
                                    <FormErrorMessage>{errors.acquisition_date}</FormErrorMessage>
                                </FormControl>
                            </Stack>
                            <Stack spacing={4}>
                                <FormControl isInvalid={!!errors.location_id} isRequired>
                                    <FormLabel>Polo</FormLabel>
                                    <Select
                                        value={formData.location_id}
                                        onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                        placeholder="Selecione a localização"
                                    >
                                        {Array.isArray(locations) && locations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </Select>
                                    <FormErrorMessage>{errors.location_id}</FormErrorMessage>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Ambiente</FormLabel>
                                    <Select
                                        value={formData.locale_id}
                                        onChange={(e) => setFormData({ ...formData, locale_id: e.target.value })}
                                        placeholder="Selecione o ambiente"
                                        isDisabled={!formData.location_id}
                                    >
                                        {Array.isArray(locales) && locales
                                            .filter(locale => locale.location_id === formData.location_id)
                                            .map((locale) => (
                                            <option key={locale.id} value={locale.id}>
                                                {locale.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl isInvalid={!!errors.category_id} isRequired>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select
                                        value={formData.category_id}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        placeholder="Selecione a categoria"
                                    >
                                        {Array.isArray(categories) && categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </Select>
                                    <FormErrorMessage>{errors.category_id}</FormErrorMessage>
                                </FormControl>
                                <FormControl isInvalid={!!errors.subcategory_id} isRequired>
                                    <FormLabel>Subcategoria</FormLabel>
                                    <Select
                                        value={formData.subcategory_id}
                                        onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                                        placeholder="Selecione a subcategoria"
                                        isDisabled={!formData.category_id}
                                    >
                                        {Array.isArray(subcategories) && subcategories.map((subcategory) => (
                                            <option key={subcategory.id} value={subcategory.id}>
                                                {subcategory.label}
                                            </option>
                                        ))}
                                    </Select>
                                    <FormErrorMessage>{errors.subcategory_id}</FormErrorMessage>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Fornecedor</FormLabel>
                                    <Select
                                        value={formData.supplier_id}
                                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                        placeholder="Selecione o fornecedor"
                                    >
                                        {Array.isArray(suppliers) && suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl isInvalid={!!errors.chart_of_account_id} isRequired>
                                    <FormLabel>Plano de Conta</FormLabel>
                                    <Select
                                        value={formData.chart_of_account_id}
                                        onChange={(e) => setFormData({ ...formData, chart_of_account_id: e.target.value })}
                                        placeholder="Selecione o plano de conta"
                                    >
                                        {Array.isArray(chartOfAccounts) && chartOfAccounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.codigo} - {account.nome}
                                            </option>
                                        ))}
                                    </Select>
                                    <FormErrorMessage>{errors.chart_of_account_id}</FormErrorMessage>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Descrição</FormLabel>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Digite uma descrição (opcional)"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="STANDBY">Em Espera</option>
                                        <option value="IN_USE">Em Uso</option>
                                        <option value="MAINTENANCE">Em Manutenção</option>
                                        <option value="DISCARDED">Descartado</option>
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Imagem</FormLabel>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, setSelectedImage, setPreviewUrl)}
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
                            </Stack>
                        </SimpleGrid>
                        <DepreciationConfigFields
                            isDepreciable={isDepreciable}
                            onDepreciableChange={handleDepreciableChange}
                            values={{
                                ncm: formData.ncm,
                                cest: formData.cest,
                                residual_value: formData.residual_value,
                                service_life: formData.service_life,
                                annual_rate: formData.annual_rate,
                                chart_of_account_id: formData.chart_of_account_id,
                                override_reason: formData.override_reason,
                            }}
                            onChange={handleDepreciationFieldChange}
                            lookedUpRate={lookedUpRate}
                            lookupNotFound={lookupNotFound}
                            isLookingUp={isLookingUp}
                            appliedSnapshots={appliedSnapshots}
                            onLookup={handleLookupDepreciationRate}
                            onApplyRate={handleApplyDepreciationRate}
                        />
                        <ButtonGroup w="full" mt={8} display="flex" justifyContent="flex-end">
                            <Button variant="outline" onClick={onClose} mr={2}>
                                Cancelar
                            </Button>
                            <Button type="submit" colorScheme="blue">
                                {isEdit ? 'Salvar Alterações' : 'Criar Item'}
                            </Button>
                        </ButtonGroup>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
} 