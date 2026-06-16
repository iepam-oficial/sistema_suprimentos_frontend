import React, { useState, useRef, useEffect, useCallback, RefObject } from 'react';
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
    InputGroup,
    InputLeftAddon,
    VStack,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,IconButton, useDisclosure, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@chakra-ui/react';
import { Supply as BaseSupply, Category, Supplier, Unit } from '../utils/types';
import {
    initializeFormDataWithFreight,
    formatCurrencyBR,
    parseCurrencyBR,
} from '../utils/suppliesUtils';
import { uploadImage } from '@/features/images/api/imageApi';
import { fetchSuppliers, fetchUnits } from '@/utils/apiUtils';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { handleImageChange } from '@/utils/imageUtils';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { ImageSourceDialog } from './ImageSourceDialog';
import { fetchSubcategoriesByCategory, type SubcategoryDTO } from '@/features/reference-data';

type Supply = BaseSupply & { freight?: number | string };

interface SupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    categories: Category[];
    initialData?: Supply;
}

export function SupplyModal({ isOpen, onClose, onSubmit, categories, initialData }: SupplyModalProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [formData, setFormData] = useState<{ [key: string]: any }>(initializeFormDataWithFreight(initialData));
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedInvoiceImage, setSelectedInvoiceImage] = useState<File | null>(null);
    const [previewInvoiceUrl, setPreviewInvoiceUrl] = useState<string>('');
    const [subcategories, setSubcategories] = useState<SubcategoryDTO[]>([]);
    const toast = useToast();
    const inputFileRef = useRef<HTMLInputElement | null>(null);
    const [fileCapture, setFileCapture] = useState<'environment' | 'user' | undefined>(undefined);
    const [showImageChoice, setShowImageChoice] = useState(false);
    // Adicionar refs e estados para nota fiscal
    const inputInvoiceFileRef = useRef<HTMLInputElement | null>(null);
    const [invoiceFileCapture, setInvoiceFileCapture] = useState<'environment' | 'user' | undefined>(undefined);
    const [showInvoiceImageChoice, setShowInvoiceImageChoice] = useState(false);
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
        } catch (error) {
            setSubcategories([]);
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(initializeFormDataWithFreight(initialData));
            if (initialData.image_url) {
                setPreviewUrl(initialData.image_url);
            }
            if ((initialData as any).invoice_url) {
                setPreviewInvoiceUrl((initialData as any).invoice_url);
            }
            if (initialData.category?.id) {
                loadSubcategories(initialData.category.id);
            }
        } else {
            setFormData(initializeFormDataWithFreight());
            setPreviewUrl('');
            setPreviewInvoiceUrl('');
            setSubcategories([]);
        }
    }, [initialData, loadSubcategories]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [suppliersData, unitsData, chartOfAccountsData] = await Promise.all([
                    fetchSuppliers(),
                    fetchUnits(),
                    fetchChartOfAccounts('ATIVO') // Para suprimentos, usar ATIVO (ESTOQUES)
                ]);
                setSuppliers(suppliersData);
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

        // Validação do plano de conta
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
            let imageUrl = formData.image_url;
            let invoiceUrl = (formData as any).invoice_url;

            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            if (selectedInvoiceImage) {
                invoiceUrl = await uploadImage(selectedInvoiceImage);
            }

            onSubmit({
                ...formData,
                image_url: imageUrl,
                invoice_url: invoiceUrl,
                unit_price: parseCurrencyBR(String(formData.unit_price)),
                freight: formData.freight ? parseCurrencyBR(String(formData.freight)) : 0,
                subcategory_id: formData.subcategory_id || undefined,
                chart_of_account_id: formData.chart_of_account_id,
            });
            // limpa o modal e reseta o estado
            setFormData(initializeFormDataWithFreight());
            setSelectedImage(null);
            setPreviewUrl('');
            setSelectedInvoiceImage(null);
            setPreviewInvoiceUrl('');
            onClose();
        } catch (error) {
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
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome do suprimento"
                                />
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '2' }}>
                                <FormLabel>Descrição</FormLabel>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição do suprimento"
                                />
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Quantidade</FormLabel>
                                <NumberInput
                                    min={0}
                                    value={formData.quantity}
                                    onChange={(_, value) => setFormData({ ...formData, quantity: value })}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '2' }}>
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

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Unidade de Medida</FormLabel>
                                <Select
                                    value={formData.unit_id}
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

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '2' }}>
                                <FormLabel>Categoria</FormLabel>
                                <Select
                                    value={formData.category_id}
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

                            <FormControl gridColumn={{ base: 'auto', md: '1' }} isDisabled={!formData.category_id}>
                                <FormLabel>Subcategoria</FormLabel>
                                <Select
                                    value={formData.subcategory_id || ''}
                                    onChange={e => setFormData({ ...formData, subcategory_id: e.target.value })}
                                    placeholder="Selecione uma subcategoria"
                                >
                                    {subcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Fornecedor</FormLabel>
                                <Select
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                >
                                    <option value="">Selecione um fornecedor</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '2' }}>
                                <FormLabel>Plano de Conta</FormLabel>
                                <Select
                                    value={formData.chart_of_account_id || ''}
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

                            <FormControl isRequired gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Preço Unitário</FormLabel>
                                <Box fontSize="sm" color="gray.500" mb={1}>
                                    Ex: 1.234,56
                                </Box>
                                <InputGroup>
                                    <InputLeftAddon>R$</InputLeftAddon>
                                    <Input
                                        pl={10}
                                        value={formData.unit_price || ''}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/[^\d.,]/g, '');
                                            setFormData({ ...formData, unit_price: raw });
                                        }}
                                        onBlur={e => {
                                            setFormData({ ...formData, unit_price: formatCurrencyBR(e.target.value) });
                                        }}
                                        placeholder="0,00"
                                    />
                                </InputGroup>
                            </FormControl>

                            <FormControl gridColumn={{ base: 'auto', md: '1' }}>
                                <FormLabel>Frete</FormLabel>
                                <Box fontSize="sm" color="gray.500" mb={1}>
                                    Ex: 1.234,56
                                </Box>
                                <InputGroup>
                                    <InputLeftAddon>R$</InputLeftAddon>
                                    <Input
                                        pl={10}
                                        value={formData.freight || ''}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/[^\d.,]/g, '');
                                            setFormData({ ...formData, freight: raw });
                                        }}
                                        onBlur={e => {
                                            setFormData({ ...formData, freight: formatCurrencyBR(e.target.value) });
                                        }}
                                        placeholder="0,00"
                                    />
                                </InputGroup>
                            </FormControl>

                            <FormControl gridColumn={{ base: 'auto', md: '2' }}>
                                <Button
                                    mt={"2vh"}
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

                            <FormControl gridColumn={{ base: 'auto', md: '1' }}>
                                <Button
                                    minW="full"
                                    leftIcon={<ImageIcon size={18} />}
                                    onClick={() => setShowInvoiceImageChoice(true)}
                                    colorScheme="blue"

                                    mb={2}
                                >
                                    Carregar imagem nota fiscal
                                </Button>
                                <input
                                    ref={inputInvoiceFileRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    capture={invoiceFileCapture ?? undefined}
                                    onChange={(e) => {
                                        handleImageChange(e, setSelectedInvoiceImage, setPreviewInvoiceUrl);
                                        setInvoiceFileCapture(undefined);
                                    }}
                                />
                                <ImageSourceDialog
                                    isOpen={showInvoiceImageChoice}
                                    onClose={() => setShowInvoiceImageChoice(false)}
                                    onSelectGallery={() => {
                                        setInvoiceFileCapture(undefined);
                                        setShowInvoiceImageChoice(false);
                                        setTimeout(() => inputInvoiceFileRef.current?.click(), 100);
                                    }}
                                    onSelectCamera={() => {
                                        setInvoiceFileCapture('environment');
                                        setShowInvoiceImageChoice(false);
                                        setTimeout(() => inputInvoiceFileRef.current?.click(), 100);
                                    }}
                                    leastDestructiveRef={leastDestructiveRef}
                                    title="Como deseja carregar a nota fiscal?"
                                />
                                {previewInvoiceUrl && (
                                    <Box mt={2}>
                                        <Image
                                            src={previewInvoiceUrl}
                                            alt="Preview NF"
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