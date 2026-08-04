/** Snapshot fiscal de uma linha de NF (canônico compartilhado). */
export interface InvoiceLineFiscalSnapshot {
    commercial_unit: string | null;
    cfop: string | null;
    cst: string | null;
    discount_value: number | null;
    icms_base: number | null;
    icms_value: number | null;
    icms_rate: number | null;
    icms_st_base: number | null;
    icms_st_value: number | null;
    ipi_value: number | null;
    ipi_rate: number | null;
    ibs_value: number | null;
    cbs_value: number | null;
    is_value: number | null;
}
/** Campos fiscais opcionais para parse / suggest / confirm / patch. */
export type InvoiceLineFiscalSnapshotInput = Partial<InvoiceLineFiscalSnapshot>;
//# sourceMappingURL=invoice-fiscal.dto.d.ts.map