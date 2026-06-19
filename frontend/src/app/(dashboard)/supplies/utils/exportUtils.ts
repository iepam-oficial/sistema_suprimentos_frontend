import { Supply } from './types';
import { exportToPDF } from '@/utils/exportToPDF';
import { getSuppliesBelowMinimum } from './filterUtils';

export const exportSuppliesBelowMinimum = async (supplies: Supply[]) => {
    const suppliesBelowMinimum = getSuppliesBelowMinimum(supplies);

    try {
        await exportToPDF({
            title: 'Relatório de Suprimentos Abaixo do Mínimo',
            head: [
                'Nome', 'Descrição', 'Quantidade Atual', 'Quantidade Mínima', 'Quantidade a Comprar', 'Unidade', 'Categoria'
            ],
            body: suppliesBelowMinimum.map(supply => [
                supply.name,
                supply.description ?? '',
                supply.available_quantity.toString(),
                supply.minimum_quantity.toString(),
                (supply.minimum_quantity - supply.available_quantity).toString(),
                supply.unit?.symbol ?? '',
                supply.category?.label ?? '',
            ]),
            fileName: 'suprimentos_abaixo_minimo.pdf',
            orientation: 'landscape'
        });

        return true;
    } catch (error) {
        throw new Error('Erro ao gerar relatório de suprimentos abaixo do mínimo');
    }
}; 