export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'HR' | 'OFFICER' | 'REVIEWER' | 'USER' | 'APPLICANT';

export type Permission =
    | 'view_dashboard'
    | 'view_letters'
    | 'create_letters'
    | 'edit_letters'
    | 'delete_letters'
    | 'view_templates'
    | 'create_templates'
    | 'edit_templates'
    | 'delete_templates'
    | 'view_hr'
    | 'manage_employees'
    | 'manage_organizations'
    | 'view_reports'
    | 'manage_stamps';

export const RolePermissions: Record<string, Permission[]> = {
    SUPER_ADMIN: [
        'view_dashboard', 'view_letters', 'create_letters', 'edit_letters', 'delete_letters',
        'view_templates', 'create_templates', 'edit_templates', 'delete_templates',
        'view_hr', 'manage_employees', 'manage_organizations', 'view_reports', 'manage_stamps'
    ],
    ORG_ADMIN: [
        'view_dashboard', 'view_letters', 'create_letters', 'edit_letters',
        'view_templates', 'create_templates', 'edit_templates',
        'view_hr', 'manage_employees', 'view_reports', 'manage_stamps'
    ],
    HR: [
        'view_dashboard', 'view_hr', 'manage_employees', 'view_reports'
    ],
    OFFICER: [
        'view_dashboard', 'view_letters', 'create_letters', 'edit_letters',
        'view_templates', 'view_reports'
    ],
    REVIEWER: [
        'view_dashboard', 'view_letters',
        'view_reports'
    ],
    USER: [
        'view_dashboard', 'view_letters'
    ],
    APPLICANT: [
        'view_dashboard', 'view_letters', 'create_letters'
    ]
};

export function hasPermission(role: string, permission: Permission): boolean {
    return RolePermissions[role]?.includes(permission) || false;
}
