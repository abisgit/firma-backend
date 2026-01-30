import "dotenv/config";
import { PrismaClient, Role, OrganizationType, LetterType, LetterStatus, Classification, IndustryType, GuardianType, GradeType, AttendanceStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const testPasswordHash = await bcrypt.hash('password123', 10);

    console.log('🌱 Seeding database...');

    // =============================================
    // GOVERNMENT ORGANIZATIONS
    // =============================================

    // Create Main Organization
    const mof = await prisma.organization.upsert({
        where: { code: 'MOF' },
        update: {},
        create: {
            name: 'Ministry of Finance',
            code: 'MOF',
            type: OrganizationType.MINISTRY,
            industryType: IndustryType.GOVERNMENT,
            phoneNumber: '+251-11-552-7000',
            location: 'Addis Ababa, Bole',
        },
    });
    console.log('✅ Created main organization: Ministry of Finance');

    // Create Sub-Organizations
    const budgetDept = await prisma.organization.upsert({
        where: { code: 'MOF-BD' },
        update: {},
        create: {
            name: 'Budget Department',
            code: 'MOF-BD',
            type: OrganizationType.SUB_ORGANIZATION,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: mof.id,
            phoneNumber: '+251-11-552-7100',
            location: 'Main Office, Floor 3',
        },
    });

    const hrDept = await prisma.organization.upsert({
        where: { code: 'MOF-HR' },
        update: {},
        create: {
            name: 'HR Department',
            code: 'MOF-HR',
            type: OrganizationType.SUB_ORGANIZATION,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: mof.id,
            phoneNumber: '+251-11-552-7200',
            location: 'Main Office, Floor 2',
        },
    });

    const planningDept = await prisma.organization.upsert({
        where: { code: 'MOF-PD' },
        update: {},
        create: {
            name: 'Planning Department',
            code: 'MOF-PD',
            type: OrganizationType.SUB_ORGANIZATION,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: mof.id,
            phoneNumber: '+251-11-552-7300',
            location: 'Main Office, Floor 4',
        },
    });

    // Create Offices under Departments
    const budgetPlanningOffice = await prisma.organization.upsert({
        where: { code: 'MOF-BD-BP' },
        update: {},
        create: {
            name: 'Budget Planning Office',
            code: 'MOF-BD-BP',
            type: OrganizationType.OFFICE,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: budgetDept.id,
            phoneNumber: '+251-11-552-7110',
            location: 'Main Office, Floor 3, Room 301',
        },
    });

    const budgetAnalysisOffice = await prisma.organization.upsert({
        where: { code: 'MOF-BD-BA' },
        update: {},
        create: {
            name: 'Budget Analysis Office',
            code: 'MOF-BD-BA',
            type: OrganizationType.OFFICE,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: budgetDept.id,
            phoneNumber: '+251-11-552-7120',
            location: 'Main Office, Floor 3, Room 305',
        },
    });

    const recruitmentOffice = await prisma.organization.upsert({
        where: { code: 'MOF-HR-RC' },
        update: {},
        create: {
            name: 'Recruitment Office',
            code: 'MOF-HR-RC',
            type: OrganizationType.OFFICE,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: hrDept.id,
            phoneNumber: '+251-11-552-7210',
            location: 'Main Office, Floor 2, Room 201',
        },
    });

    // Create Regional Offices
    const regionalOromia = await prisma.organization.upsert({
        where: { code: 'MOF-RO-OR' },
        update: {},
        create: {
            name: 'Regional Office - Oromia',
            code: 'MOF-RO-OR',
            type: OrganizationType.REGION,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: mof.id,
            phoneNumber: '+251-22-111-2222',
            location: 'Adama City',
        },
    });

    const regionalAmhara = await prisma.organization.upsert({
        where: { code: 'MOF-RO-AM' },
        update: {},
        create: {
            name: 'Regional Office - Amhara',
            code: 'MOF-RO-AM',
            type: OrganizationType.REGION,
            industryType: IndustryType.GOVERNMENT,
            parentOrganizationId: mof.id,
            phoneNumber: '+251-58-220-3333',
            location: 'Bahir Dar',
        },
    });

    // Create External Organizations
    const moh = await prisma.organization.upsert({
        where: { code: 'MOH' },
        update: {},
        create: {
            name: 'Ministry of Health',
            code: 'MOH',
            type: OrganizationType.MINISTRY,
            industryType: IndustryType.GOVERNMENT,
            phoneNumber: '+251-11-551-7011',
            location: 'Addis Ababa, Kirkos',
        },
    });

    const moe = await prisma.organization.upsert({
        where: { code: 'MOE' },
        update: {},
        create: {
            name: 'Ministry of Education',
            code: 'MOE',
            type: OrganizationType.MINISTRY,
            industryType: IndustryType.GOVERNMENT,
            phoneNumber: '+251-11-155-0033',
            location: 'Addis Ababa, Arada',
        },
    });

    const mop = await prisma.organization.upsert({
        where: { code: 'MOP' },
        update: {},
        create: {
            name: 'Ministry of Planning',
            code: 'MOP',
            type: OrganizationType.MINISTRY,
            industryType: IndustryType.GOVERNMENT,
            phoneNumber: '+251-11-646-0000',
            location: 'Addis Ababa, Bole',
        },
    });

    console.log('✅ Created government organizations and sub-organizations');

    // =============================================
    // EDUCATION ORGANIZATIONS (SCHOOLS)
    // =============================================

    // Create School Organization
    const excelAcademy = await prisma.organization.upsert({
        where: { code: 'EXCEL-ACAD' },
        update: {},
        create: {
            name: 'Excel Academy International School',
            code: 'EXCEL-ACAD',
            type: OrganizationType.SCHOOL,
            industryType: IndustryType.EDUCATION,
            phoneNumber: '+251-11-667-8900',
            location: 'Addis Ababa, Bole Sub City',
        },
    });

    // Create the School record linked to the organization
    const excelSchool = await prisma.school.upsert({
        where: { organizationId: excelAcademy.id },
        update: {},
        create: {
            organizationId: excelAcademy.id,
            motto: 'Excellence Through Education',
            establishedYear: 2010,
        },
    });

    console.log('✅ Created education organization: Excel Academy International School');

    // =============================================
    // GOVERNMENT USERS
    // =============================================

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@firma.gov' },
        update: {},
        create: {
            fullName: 'System Super Admin',
            email: 'admin@firma.gov',
            passwordHash,
            role: Role.SUPER_ADMIN,
            position: 'System Administrator',
            phoneNumber: '+251-11-552-7000',
        },
    });

    const mofAdmin = await prisma.user.upsert({
        where: { email: 'mof_admin@firma.gov' },
        update: {},
        create: {
            fullName: 'MOF Administrator',
            email: 'mof_admin@firma.gov',
            passwordHash,
            role: Role.ORG_ADMIN,
            organizationId: mof.id,
            position: 'Organization Administrator',
            phoneNumber: '+251-11-552-7001',
        },
    });

    const johnDoe = await prisma.user.upsert({
        where: { email: 'john.doe@mof.gov' },
        update: {},
        create: {
            fullName: 'John Doe',
            email: 'john.doe@mof.gov',
            passwordHash,
            role: Role.OFFICER,
            organizationId: budgetDept.id,
            position: 'Budget Analyst',
            phoneNumber: '+251-11-552-7101',
        },
    });

    const janeSmith = await prisma.user.upsert({
        where: { email: 'jane.smith@mof.gov' },
        update: {},
        create: {
            fullName: 'Jane Smith',
            email: 'jane.smith@mof.gov',
            passwordHash,
            role: Role.OFFICER,
            organizationId: hrDept.id,
            position: 'HR Manager',
            phoneNumber: '+251-11-552-7201',
        },
    });

    const ahmedHassan = await prisma.user.upsert({
        where: { email: 'ahmed.hassan@mof.gov' },
        update: {},
        create: {
            fullName: 'Ahmed Hassan',
            email: 'ahmed.hassan@mof.gov',
            passwordHash,
            role: Role.OFFICER,
            organizationId: planningDept.id,
            position: 'Planning Officer',
            phoneNumber: '+251-11-552-7301',
        },
    });

    const sarahJohnson = await prisma.user.upsert({
        where: { email: 'sarah.johnson@mof.gov' },
        update: {},
        create: {
            fullName: 'Sarah Johnson',
            email: 'sarah.johnson@mof.gov',
            passwordHash,
            role: Role.REVIEWER,
            organizationId: budgetDept.id,
            position: 'Senior Budget Reviewer',
            phoneNumber: '+251-11-552-7102',
        },
    });

    console.log('✅ Created government users');

    // =============================================
    // EDUCATION USERS (School Admin, Teacher, Student, Parent)
    // =============================================

    // School Admin
    const schoolAdminUser = await prisma.user.upsert({
        where: { email: 'admin@school.test' },
        update: {},
        create: {
            fullName: 'Dr. Michael Kebede',
            email: 'admin@school.test',
            passwordHash: testPasswordHash,
            role: Role.SCHOOL_ADMIN,
            organizationId: excelAcademy.id,
            position: 'School Principal',
            phoneNumber: '+251-11-667-8901',
        },
    });

    // Update school with principal
    await prisma.school.update({
        where: { id: excelSchool.id },
        data: { principalId: schoolAdminUser.id },
    });

    // Teacher User
    const teacherUser = await prisma.user.upsert({
        where: { email: 'teacher@school.test' },
        update: {},
        create: {
            fullName: 'Ato Bekele Tadesse',
            email: 'teacher@school.test',
            passwordHash: testPasswordHash,
            role: Role.TEACHER,
            organizationId: excelAcademy.id,
            position: 'Mathematics Teacher',
            phoneNumber: '+251-11-667-8902',
        },
    });

    // Create Teacher record
    const teacher = await prisma.teacher.upsert({
        where: { userId: teacherUser.id },
        update: {},
        create: {
            userId: teacherUser.id,
            employeeNumber: 'TCH-2024-001',
        },
    });

    // Student User
    const studentUser = await prisma.user.upsert({
        where: { email: 'student@school.test' },
        update: {},
        create: {
            fullName: 'Kidus Alemayehu',
            email: 'student@school.test',
            passwordHash: testPasswordHash,
            role: Role.STUDENT,
            organizationId: excelAcademy.id,
            position: 'Student',
            phoneNumber: '+251-91-234-5678',
        },
    });

    // Create Student record
    const student = await prisma.student.upsert({
        where: { userId: studentUser.id },
        update: {},
        create: {
            userId: studentUser.id,
            admissionNumber: 'STU-2024-001',
            dateOfBirth: new Date('2010-05-15'),
        },
    });

    // Parent User
    const parentUser = await prisma.user.upsert({
        where: { email: 'parent@school.test' },
        update: {},
        create: {
            fullName: 'Ato Alemayehu Girma',
            email: 'parent@school.test',
            passwordHash: testPasswordHash,
            role: Role.PARENT,
            organizationId: excelAcademy.id,
            position: 'Parent',
            phoneNumber: '+251-91-876-5432',
        },
    });

    // Create Parent record
    const parent = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: {
            userId: parentUser.id,
        },
    });

    // Link Parent to Student
    await prisma.studentGuardian.upsert({
        where: {
            studentId_parentId: {
                studentId: student.id,
                parentId: parent.id,
            },
        },
        update: {},
        create: {
            studentId: student.id,
            parentId: parent.id,
            relationship: GuardianType.FATHER,
            isPrimary: true,
        },
    });

    console.log('✅ Created education users (School Admin, Teacher, Student, Parent)');

    // =============================================
    // EDUCATION DATA (Subjects, Classes, Academic Year)
    // =============================================

    // Create Subjects
    const mathSubject = await prisma.subject.upsert({
        where: {
            code_schoolId: {
                code: 'MATH',
                schoolId: excelSchool.id,
            },
        },
        update: {},
        create: {
            name: 'Mathematics',
            code: 'MATH',
            schoolId: excelSchool.id,
        },
    });

    const engSubject = await prisma.subject.upsert({
        where: {
            code_schoolId: {
                code: 'ENG',
                schoolId: excelSchool.id,
            },
        },
        update: {},
        create: {
            name: 'English',
            code: 'ENG',
            schoolId: excelSchool.id,
        },
    });

    const sciSubject = await prisma.subject.upsert({
        where: {
            code_schoolId: {
                code: 'SCI',
                schoolId: excelSchool.id,
            },
        },
        update: {},
        create: {
            name: 'Science',
            code: 'SCI',
            schoolId: excelSchool.id,
        },
    });

    // Create Academic Year
    const academicYear = await prisma.academicYear.create({
        data: {
            name: '2025-2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-06-30'),
            isCurrent: true,
            schoolId: excelSchool.id,
        },
    });

    // Create Terms
    const term1 = await prisma.term.create({
        data: {
            name: 'First Semester',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-01-15'),
            academicYearId: academicYear.id,
        },
    });

    const term2 = await prisma.term.create({
        data: {
            name: 'Second Semester',
            startDate: new Date('2026-01-20'),
            endDate: new Date('2026-06-30'),
            academicYearId: academicYear.id,
        },
    });

    // Create Class
    const grade8A = await prisma.class.create({
        data: {
            name: 'Grade 8 - Section A',
            grade: '8',
            section: 'A',
            schoolId: excelSchool.id,
            academicYear: '2025-2026',
            capacity: 35,
        },
    });

    // Assign student to class
    await prisma.student.update({
        where: { id: student.id },
        data: { classId: grade8A.id },
    });

    // Assign teacher to class
    await prisma.classTeacher.create({
        data: {
            classId: grade8A.id,
            teacherId: teacher.id,
            isHead: true,
        },
    });

    // Assign subjects to teacher
    await prisma.teacherSubject.create({
        data: {
            teacherId: teacher.id,
            subjectId: mathSubject.id,
        },
    });

    // Assign subjects to class
    await prisma.classSubject.createMany({
        data: [
            { classId: grade8A.id, subjectId: mathSubject.id },
            { classId: grade8A.id, subjectId: engSubject.id },
            { classId: grade8A.id, subjectId: sciSubject.id },
        ],
        skipDuplicates: true,
    });

    // Create sample timetable
    await prisma.timetable.createMany({
        data: [
            {
                classId: grade8A.id,
                subjectId: mathSubject.id,
                teacherId: teacherUser.id,
                dayOfWeek: 1, // Monday
                startTime: '08:00',
                endTime: '08:45',
                room: 'Room 101',
            },
            {
                classId: grade8A.id,
                subjectId: engSubject.id,
                teacherId: teacherUser.id,
                dayOfWeek: 1, // Monday
                startTime: '09:00',
                endTime: '09:45',
                room: 'Room 101',
            },
            {
                classId: grade8A.id,
                subjectId: sciSubject.id,
                teacherId: teacherUser.id,
                dayOfWeek: 2, // Tuesday
                startTime: '08:00',
                endTime: '08:45',
                room: 'Lab 1',
            },
        ],
    });


    // Create sample grades
    await prisma.grade.create({
        data: {
            studentId: student.id,
            subjectId: mathSubject.id,
            termId: term1.id,
            score: 85,
            maxScore: 100,
            gradeType: GradeType.EXAM,
            remarks: 'Good performance',
            gradedById: teacherUser.id,
        },
    });

    // Create sample attendance
    await prisma.attendance.createMany({
        data: [
            {
                studentId: student.id,
                date: new Date('2026-01-27'),
                status: AttendanceStatus.PRESENT,
                markedById: teacherUser.id,
            },
            {
                studentId: student.id,
                date: new Date('2026-01-28'),
                status: AttendanceStatus.PRESENT,
                markedById: teacherUser.id,
            },
            {
                studentId: student.id,
                date: new Date('2026-01-29'),
                status: AttendanceStatus.LATE,
                remarks: 'Arrived 10 minutes late',
                markedById: teacherUser.id,
            },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Created education data (Subjects, Classes, Academic Year, Grades, Attendance)');

    // =============================================
    // LETTER TEMPLATES
    // =============================================

    const templates = [
        {
            name: 'Budget Approval Request',
            letterType: LetterType.HIERARCHICAL,
            content: `[Organization Letterhead]

Date: [Date]
Reference Number: [Reference Number]

To: [Recipient Name]
     [Recipient Position]
     [Recipient Organization]

Subject: Budget Approval Request for [Period]

Dear [Recipient Title],

I am writing to request your approval for the budget allocation for [Department/Project Name] for the period of [Time Period].

The proposed budget breakdown is as follows:
- Personnel Costs: [Amount]
- Operational Expenses: [Amount]
- Capital Expenditure: [Amount]
- Total: [Total Amount]

This budget is essential for [Justification and objectives].

We kindly request your review and approval at your earliest convenience.

Respectfully,

[Sender Name]
[Sender Position]
[Organization Name]
[Contact Information]`,
        },
        {
            name: 'Staff Transfer Notification',
            letterType: LetterType.STAFF,
            content: `[Organization Letterhead]

Date: [Date]
Reference Number: [Reference Number]

To: [Employee Name]
     [Current Position]
     [Current Department]

Subject: Transfer Notification

Dear [Employee Name],

This letter serves to officially notify you of your transfer from [Current Department] to [New Department], effective [Effective Date].

Transfer Details:
- New Position: [New Position]
- New Department: [New Department]
- New Location: [New Location]
- Effective Date: [Effective Date]
- Reporting To: [Supervisor Name]

Please report to [Location] on [Date] to complete the necessary formalities.

We wish you success in your new role.

Sincerely,

[HR Manager Name]
[HR Department]
[Contact Information]`,
        },
        {
            name: 'Inter-Department Coordination',
            letterType: LetterType.CROSS_STRUCTURE,
            content: `[Organization Letterhead]

Date: [Date]
Reference Number: [Reference Number]

To: [Department Head Name]
     [Department Name]

Subject: Request for Inter-Department Coordination on [Project/Initiative]

Dear [Recipient],

We are writing to request coordination between our departments regarding [Project/Initiative Name].

Purpose:
[Brief description of the coordination purpose]

Required Actions:
1. [Action Item 1]
2. [Action Item 2]
3. [Action Item 3]

Timeline: [Timeline]
Meeting Proposed: [Date and Time]

Your cooperation in this matter would be greatly appreciated.

Best regards,

[Sender Name]
[Sender Position]
[Department]
[Contact Information]`,
        },
        {
            name: 'Meeting Invitation',
            letterType: LetterType.HEAD_OFFICE,
            content: `[Organization Letterhead]

Date: [Date]
Reference Number: [Reference Number]

To: [Recipient Name/Department]

Subject: Invitation to [Meeting Name]

Dear [Recipient],

You are cordially invited to attend [Meeting Name] scheduled as follows:

Meeting Details:
- Date: [Date]
- Time: [Time]
- Venue: [Location]
- Duration: [Duration]

Agenda:
1. [Agenda Item 1]
2. [Agenda Item 2]
3. [Agenda Item 3]
4. Any Other Business

Please confirm your attendance by [RSVP Date].

Looking forward to your participation.

Regards,

[Organizer Name]
[Position]
[Contact Information]`,
        },
        {
            name: 'Official Notice',
            letterType: LetterType.HEAD_OFFICE,
            content: `[Organization Letterhead]

Date: [Date]
Reference Number: [Reference Number]

OFFICIAL NOTICE

To: All Staff Members

Subject: [Notice Subject]

This is to inform all staff members that [Main Announcement].

Details:
[Detailed information about the notice]

Effective Date: [Date]
Compliance Required: [Yes/No]

For any questions or clarifications, please contact [Contact Person] at [Contact Information].

By Order,

[Authorized Signatory]
[Position]
[Organization Name]`,
        },
        {
            name: 'Guest Visit Notification',
            letterType: LetterType.GUEST,
            content: `[Organization Letterhead]

Date: [Date]
Reference Number: [Reference Number]

To: [Recipient]

Subject: Notification of Guest Visit

Dear [Recipient],

We would like to inform you of an upcoming visit by [Guest Name], [Guest Title] from [Guest Organization].

Visit Details:
- Guest: [Guest Name and Title]
- Organization: [Guest Organization]
- Date of Visit: [Date]
- Time: [Time]
- Purpose: [Purpose of Visit]
- Meeting Location: [Location]

Please make necessary arrangements for the visit.

Thank you for your cooperation.

Sincerely,

[Sender Name]
[Position]
[Contact Information]`,
        },
    ];

    for (const template of templates) {
        await prisma.letterTemplate.upsert({
            where: {
                name_organizationId: {
                    name: template.name,
                    organizationId: null as unknown as string,
                }
            },
            update: {},
            create: template,
        });
    }

    console.log('✅ Created letter templates');

    // =============================================
    // SAMPLE LETTERS
    // =============================================

    const letter1 = await prisma.letter.create({
        data: {
            referenceNumber: 'MOF/2026/001',
            subject: 'Budget Approval Request Q1 2026',
            content: 'This is the content of the budget approval request for Q1 2026...',
            letterType: LetterType.HIERARCHICAL,
            status: LetterStatus.SENT,
            classification: Classification.INTERNAL,
            senderOrgId: mof.id,
            recipientOrgId: mop.id,
            createdById: mofAdmin.id,
            letterDate: new Date('2026-01-20'),
            sentAt: new Date('2026-01-20T10:30:00'),
        },
    });

    const letter2 = await prisma.letter.create({
        data: {
            referenceNumber: 'MOF/2026/002',
            subject: 'Staff Transfer Notification - John Doe',
            content: 'This letter serves to notify the transfer of John Doe...',
            letterType: LetterType.STAFF,
            status: LetterStatus.DRAFT,
            classification: Classification.INTERNAL,
            senderOrgId: hrDept.id,
            recipientUserId: johnDoe.id,
            createdById: janeSmith.id,
            letterDate: new Date('2026-01-21'),
        },
    });

    const letter3 = await prisma.letter.create({
        data: {
            referenceNumber: 'MOF/2026/003',
            subject: 'Inter-Department Coordination Meeting',
            content: 'Request for coordination meeting between departments...',
            letterType: LetterType.CROSS_STRUCTURE,
            status: LetterStatus.SENT,
            classification: Classification.INTERNAL,
            senderOrgId: budgetDept.id,
            recipientOrgId: moh.id,
            createdById: johnDoe.id,
            letterDate: new Date('2026-01-19'),
            sentAt: new Date('2026-01-19T14:00:00'),
        },
    });

    // Add CC recipients
    await prisma.letterCC.create({
        data: {
            letterId: letter1.id,
            organizationId: moh.id,
        },
    });

    await prisma.letterCC.create({
        data: {
            letterId: letter1.id,
            organizationId: moe.id,
        },
    });

    // Create Letter Counter for MOF to match seeded letter (MOF/2026/001)
    await prisma.letterCounter.upsert({
        where: {
            orgId_year: {
                orgId: mof.id,
                year: 2026
            }
        },
        update: {},
        create: {
            orgId: mof.id,
            year: 2026,
            value: 1
        }
    });

    console.log('✅ Created sample letters');

    // =============================================
    // SUMMARY
    // =============================================

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('───────────────────────────────────────────');
    console.log('GOVERNMENT:');
    console.log('  - Organizations: 11 (1 main + 3 departments + 3 offices + 2 regional + 3 external)');
    console.log('  - Users: 6');
    console.log('  - Letter Templates: 6');
    console.log('  - Sample Letters: 3');
    console.log('');
    console.log('EDUCATION:');
    console.log('  - Schools: 1 (Excel Academy International School)');
    console.log('  - Users: 4 (1 admin, 1 teacher, 1 student, 1 parent)');
    console.log('  - Subjects: 3 (Math, English, Science)');
    console.log('  - Classes: 1 (Grade 8 - Section A)');
    console.log('  - Academic Year: 1 (2025-2026)');
    console.log('───────────────────────────────────────────');
    console.log('\n🔑 Login Credentials:');
    console.log('');
    console.log('📋 GOVERNMENT USERS:');
    console.log('  - Super Admin: admin@firma.gov / admin123');
    console.log('  - Org Admin: mof_admin@firma.gov / admin123');
    console.log('  - Officer: john.doe@mof.gov / admin123');
    console.log('');
    console.log('🏫 EDUCATION USERS:');
    console.log('  - School Admin: admin@school.test / password123');
    console.log('  - Teacher: teacher@school.test / password123');
    console.log('  - Student: student@school.test / password123');
    console.log('  - Parent: parent@school.test / password123');
    console.log('───────────────────────────────────────────');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
