import "dotenv/config";
import { PrismaClient, Role, OrganizationType, LetterType, LetterStatus, Classification } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    console.log('🌱 Seeding database...');

    // Create Main Organization
    const mof = await prisma.organization.upsert({
        where: { code: 'MOF' },
        update: {},
        create: {
            name: 'Ministry of Finance',
            code: 'MOF',
            type: OrganizationType.MINISTRY,
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
            phoneNumber: '+251-11-646-0000',
            location: 'Addis Ababa, Bole',
        },
    });

    console.log('✅ Created organizations and sub-organizations');

    // Create Users
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

    console.log('✅ Created users');

    // Create Letter Templates
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
                name: template.name
            },
            update: {},
            create: template,
        });
    }

    console.log('✅ Created letter templates');

    // Create Sample Letters
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

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Organizations: 11 (1 main + 3 departments + 3 offices + 2 regional + 3 external)');
    console.log('- Users: 6');
    console.log('- Letter Templates: 6');
    console.log('- Sample Letters: 3');
    console.log('\n🔑 Login Credentials:');
    console.log('- Super Admin: admin@firma.gov / admin123');
    console.log('- Org Admin: mof_admin@firma.gov / admin123');
    console.log('- Officer: john.doe@mof.gov / admin123');
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
