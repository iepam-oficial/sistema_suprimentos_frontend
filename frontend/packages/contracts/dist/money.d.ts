type MoneyInput = number | string;
export declare function toMinor(value: MoneyInput): number;
export declare function fromMinor(minor: number): number;
export declare function addMoney(a: MoneyInput, b: MoneyInput): number;
export declare function subMoney(a: MoneyInput, b: MoneyInput): number;
export declare function mulMoney(value: MoneyInput, multiplier: number): number;
export declare function sumMoney(values: MoneyInput[]): number;
export declare function formatBRL(value: MoneyInput): string;
export {};
//# sourceMappingURL=money.d.ts.map