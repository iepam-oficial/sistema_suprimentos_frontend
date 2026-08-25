import { hasRiskyRoleCombo } from '@/app/(dashboard)/settings/components/roleComboRisk';

describe('hasRiskyRoleCombo', () => {
  it('is false for single safe roles', () => {
    expect(hasRiskyRoleCombo(['EMPLOYEE'])).toBe(false);
    expect(hasRiskyRoleCombo(['ADMIN'])).toBe(false);
    expect(hasRiskyRoleCombo(['MANAGER'])).toBe(false);
    expect(hasRiskyRoleCombo(['DIRECTOR'])).toBe(false);
  });

  it('detects COORDINATOR + DIRECTOR', () => {
    expect(hasRiskyRoleCombo(['COORDINATOR', 'DIRECTOR'])).toBe(true);
  });

  it('detects MANAGER + DIRECTOR', () => {
    expect(hasRiskyRoleCombo(['MANAGER', 'DIRECTOR'])).toBe(true);
  });

  it('detects COORDINATOR + MANAGER + DIRECTOR', () => {
    expect(hasRiskyRoleCombo(['COORDINATOR', 'MANAGER', 'DIRECTOR'])).toBe(true);
  });

  it('detects ADMIN + any other role', () => {
    expect(hasRiskyRoleCombo(['ADMIN', 'EMPLOYEE'])).toBe(true);
    expect(hasRiskyRoleCombo(['ADMIN', 'MANAGER'])).toBe(true);
  });

  it('detects MANAGER + self-service partner', () => {
    expect(hasRiskyRoleCombo(['MANAGER', 'EMPLOYEE'])).toBe(true);
    expect(hasRiskyRoleCombo(['MANAGER', 'ORGANIZER'])).toBe(true);
    expect(hasRiskyRoleCombo(['MANAGER', 'TECHNICIAN'])).toBe(true);
    expect(hasRiskyRoleCombo(['MANAGER', 'COORDINATOR'])).toBe(true);
  });

  it('detects TECHNICIAN + SUPPORT', () => {
    expect(hasRiskyRoleCombo(['TECHNICIAN', 'SUPPORT'])).toBe(true);
  });

  it('is false for SUPPORT + EMPLOYEE (not in list)', () => {
    expect(hasRiskyRoleCombo(['SUPPORT', 'EMPLOYEE'])).toBe(false);
  });
});
