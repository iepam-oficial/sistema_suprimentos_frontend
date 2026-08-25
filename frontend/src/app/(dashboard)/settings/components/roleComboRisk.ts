/** Self-service roles that, paired with MANAGER, trigger the assignment disclaimer. */
const MANAGER_SELF_SERVICE_PARTNERS: ReadonlySet<string> = new Set([
  'EMPLOYEE',
  'ORGANIZER',
  'TECHNICIAN',
  'COORDINATOR',
]);

/**
 * Risk combos from context AD-003 (disclaimer only — never blocks API).
 * 1 COORDINATOR+DIRECTOR · 2 MANAGER+DIRECTOR · 3 COORD+MANAGER+DIRECTOR
 * 4 ADMIN+outra · 5 MANAGER+self-service · 6 TECHNICIAN+SUPPORT
 */
export function hasRiskyRoleCombo(roles: readonly string[]): boolean {
  const set = new Set(roles);
  const has = (role: string) => set.has(role);

  if (has('COORDINATOR') && has('DIRECTOR')) return true;
  if (has('MANAGER') && has('DIRECTOR')) return true;
  if (has('COORDINATOR') && has('MANAGER') && has('DIRECTOR')) return true;
  if (has('ADMIN') && set.size > 1) return true;
  if (
    has('MANAGER') &&
    [...set].some((r) => MANAGER_SELF_SERVICE_PARTNERS.has(r))
  ) {
    return true;
  }
  if (has('TECHNICIAN') && has('SUPPORT')) return true;

  return false;
}
