export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'HR' | 'OFFICER' | 'REVIEWER' | 'USER' | 'APPLICANT' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

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
    | 'manage_stamps'
    // Education Permissions
    | 'manage_school'
    | 'manage_drivers'
    | 'manage_students'
    | 'view_students'
    | 'manage_teachers'
    | 'view_teachers'
    | 'manage_classes'
    | 'view_classes'
    | 'manage_subjects'
    | 'view_subjects'
    | 'manage_schedule'
    | 'manage_attendance'
    | 'view_attendance'
    | 'mark_attendance'
    | 'manage_assignments'
    | 'grade_assignments'
    | 'manage_grades'
    | 'view_grades'
    | 'edit_grades'
    | 'view_canteen'
    | 'manage_timetable'
    | 'view_timetable'
    | 'manage_events'
    | 'view_events';

export const RolePermissions: Record<string, Permission[]> = {
    SUPER_ADMIN: [
        'view_dashboard', 'view_letters', 'create_letters', 'edit_letters', 'delete_letters',
        'view_templates', 'create_templates', 'edit_templates', 'delete_templates',
        'view_hr', 'manage_employees', 'manage_organizations', 'view_reports', 'manage_stamps',
        'manage_events', 'view_events'
    ],
    ORG_ADMIN: [
        'view_dashboard', 'view_letters', 'create_letters', 'edit_letters', 'delete_letters',
        'view_templates', 'create_templates', 'edit_templates', 'delete_templates',
        'view_hr', 'manage_employees', 'view_reports', 'manage_stamps',
        'manage_events', 'view_events',
        // Fallback Education Permissions
        'manage_school',
        'manage_students', 'view_students',
        'manage_teachers', 'view_teachers',
        'manage_classes', 'view_classes',
        'manage_subjects', 'view_subjects',
        'manage_schedule',
        'manage_attendance', 'view_attendance', 'mark_attendance',
        'manage_grades', 'view_grades', 'edit_grades',
        'manage_timetable', 'view_timetable'
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
    ],
    // Education Roles
    SCHOOL_ADMIN: [
        'view_dashboard',
        'manage_school',
        'manage_students', 'view_students',
        'manage_teachers', 'view_teachers',
        'manage_classes', 'view_classes',
        'manage_subjects', 'view_subjects',
        'manage_schedule',
        'manage_attendance', 'view_attendance', 'mark_attendance',
        'manage_grades', 'view_grades', 'edit_grades',
        'manage_timetable', 'view_timetable',
        'view_reports',
        'manage_employees',
        'manage_events',
        'view_events',
        'view_letters', 'create_letters', 'edit_letters', 'delete_letters',
        'view_templates', 'create_templates', 'edit_templates', 'delete_templates',
        'manage_stamps'
    ],
    TEACHER: [
        'view_dashboard',
        'view_students',
        'view_teachers',
        'view_classes',
        'view_subjects',
        'manage_attendance',
        'view_attendance',
        'mark_attendance',
        'manage_assignments',
        'grade_assignments',
        'manage_grades',
        'view_grades',
        'edit_grades',
        'view_timetable',
        'view_events',
        'view_letters', 'create_letters'
    ],
    STUDENT: [
        'view_dashboard',
        'view_classes',
        'view_subjects',
        'view_attendance',
        'view_grades',
        'view_timetable',
        'view_canteen',
        'view_events',
        'view_letters'
    ],
    PARENT: [
        'view_dashboard',
        'view_classes',
        'view_subjects',
        'view_attendance',
        'view_grades',
        'view_canteen',
        'view_events',
        'view_letters'
    ]
};

export function hasPermission(role: string, permission: Permission): boolean {
    return RolePermissions[role]?.includes(permission) || false;
}
