export type UserRole = 'admin' | 'technician' | 'customer';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

const roleByEmail: Record<string, UserRole> = {
  'admin@facility.com': 'admin',
  'dispatcher@facility.com': 'technician',
  'ops.lead@facility.com': 'technician',
  'viewer@facility.com': 'customer',
  'reports@facility.com': 'customer'
};

export function getRoleForEmail(email: string): UserRole {
  return roleByEmail[email.trim().toLowerCase()] ?? 'customer';
}

export function getDisplayNameFromEmail(email: string): string {
  const [localPart] = email.split('@');
  if (!localPart) return 'User';

  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function canManageDispatch(role: UserRole): boolean {
  return role === 'admin';
}

export function canAccessView(role: UserRole, view: 'dashboard' | 'map' | 'orders' | 'services' | 'service-packages' | 'reports' | 'settings'): boolean {
  if (role === 'admin') {
    return true;
  }

  if (role === 'technician') {
    return view === 'dashboard' || view === 'map' || view === 'orders' || view === 'reports';
  }

  return view === 'dashboard' || view === 'reports';
}
