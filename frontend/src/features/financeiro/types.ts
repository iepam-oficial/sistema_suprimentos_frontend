import type { ExtraExpenseDTO } from '@ti-assistant/contracts';

export type {
  ChartOfAccountType,
  ChartOfAccountDTO,
  ExtraExpenseCategoryDTO,
  ExtraExpenseDTO,
  FinanceLocationRefDTO,
  FinanceEventRefDTO,
  FinanceUserRefDTO,
  CreateExtraExpenseInput,
  UpdateExtraExpenseInput,
  CreateExtraExpenseCategoryInput,
  UpdateExtraExpenseCategoryInput,
  ExtraExpenseFilters,
  ExtraExpensePeriodTotalDTO,
  ExtraExpenseCategoryTotalDTO,
} from '@ti-assistant/contracts';

export type ExtraExpense = ExtraExpenseDTO;
export type CreateExtraExpenseData = import('@ti-assistant/contracts').CreateExtraExpenseInput;
export type UpdateExtraExpenseData = import('@ti-assistant/contracts').UpdateExtraExpenseInput;
export type ChartOfAccount = import('@ti-assistant/contracts').ChartOfAccountDTO;
export type ExtraExpenseCategory = import('@ti-assistant/contracts').ExtraExpenseCategoryDTO;

const FINANCE_MANAGER_ROLES = ['ADMIN', 'MANAGER'] as const;

export function canManageExtraExpenses(role: string | undefined): boolean {
  return FINANCE_MANAGER_ROLES.includes(role as (typeof FINANCE_MANAGER_ROLES)[number]);
}
