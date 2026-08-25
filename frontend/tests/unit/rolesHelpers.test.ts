import { UserRole } from '../../packages/contracts/src/enums';
import {
  ROLE_PRIORITY,
  normalizeRoles,
  hasAnyRole,
  isAdmin,
  getHighestPriorityRole,
  hasEmployeeSelfServiceAccess,
} from '../../packages/contracts/src/roles';

describe('roles helpers (multi-role)', () => {
  describe('normalizeRoles', () => {
    it('dedupes and returns valid UserRole values', () => {
      expect(
        normalizeRoles(['EMPLOYEE', 'MANAGER', 'EMPLOYEE', 'DIRECTOR']),
      ).toEqual([
        UserRole.EMPLOYEE,
        UserRole.MANAGER,
        UserRole.DIRECTOR,
      ]);
    });

    it('rejects empty input', () => {
      expect(() => normalizeRoles([])).toThrow(/at least one role/i);
    });

    it('rejects invalid role strings', () => {
      expect(() => normalizeRoles(['EMPLOYEE', 'NOT_A_ROLE'])).toThrow(
        /invalid role/i,
      );
    });
  });

  describe('hasAnyRole', () => {
    it('returns true when user has any of the allowed roles (union)', () => {
      expect(
        hasAnyRole(
          [UserRole.EMPLOYEE, UserRole.DIRECTOR],
          UserRole.MANAGER,
          UserRole.DIRECTOR,
        ),
      ).toBe(true);
      expect(
        hasAnyRole([UserRole.EMPLOYEE], UserRole.MANAGER, UserRole.DIRECTOR),
      ).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('detects ADMIN in the roles set', () => {
      expect(isAdmin([UserRole.EMPLOYEE, UserRole.ADMIN])).toBe(true);
      expect(isAdmin([UserRole.MANAGER, UserRole.DIRECTOR])).toBe(false);
    });
  });

  describe('getHighestPriorityRole / ROLE_PRIORITY', () => {
    it('uses locked priority scale ADMIN > DIRECTOR > … > EMPLOYEE', () => {
      expect(ROLE_PRIORITY).toEqual([
        UserRole.ADMIN,
        UserRole.DIRECTOR,
        UserRole.MANAGER,
        UserRole.COORDINATOR,
        UserRole.TECHNICIAN,
        UserRole.SUPPORT,
        UserRole.ORGANIZER,
        UserRole.EMPLOYEE,
      ]);
      expect(
        getHighestPriorityRole([UserRole.EMPLOYEE, UserRole.DIRECTOR]),
      ).toBe(UserRole.DIRECTOR);
      expect(
        getHighestPriorityRole([
          UserRole.SUPPORT,
          UserRole.COORDINATOR,
          UserRole.TECHNICIAN,
        ]),
      ).toBe(UserRole.COORDINATOR);
    });
  });

  describe('hasEmployeeSelfServiceAccess', () => {
    it('returns true when any role is in the self-service set', () => {
      expect(hasEmployeeSelfServiceAccess([UserRole.MANAGER])).toBe(false);
      expect(hasEmployeeSelfServiceAccess([UserRole.EMPLOYEE])).toBe(true);
      expect(
        hasEmployeeSelfServiceAccess([UserRole.MANAGER, UserRole.COORDINATOR]),
      ).toBe(true);
      expect(hasEmployeeSelfServiceAccess([UserRole.ORGANIZER])).toBe(true);
      expect(hasEmployeeSelfServiceAccess([UserRole.TECHNICIAN])).toBe(true);
    });
  });
});
