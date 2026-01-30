"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = void 0;
exports.hasPermission = hasPermission;
exports.RolePermissions = {
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
    ],
    // Education Roles
    SCHOOL_ADMIN: [
        'view_dashboard',
        'manage_school',
        'manage_students',
        'manage_teachers',
        'manage_classes',
        'manage_schedule',
        'manage_attendance',
        'view_reports',
        'manage_employees'
    ],
    TEACHER: [
        'view_dashboard',
        'manage_attendance',
        'view_attendance',
        'manage_assignments',
        'grade_assignments',
        'view_grades',
        'view_timetable'
    ],
    STUDENT: [
        'view_dashboard',
        'view_attendance',
        'view_grades',
        'view_timetable',
        'view_canteen'
    ],
    PARENT: [
        'view_dashboard',
        'view_attendance',
        'view_grades',
        'view_canteen'
    ]
};
function hasPermission(role, permission) {
    return exports.RolePermissions[role]?.includes(permission) || false;
}
