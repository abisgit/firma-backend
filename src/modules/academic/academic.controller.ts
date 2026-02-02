import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getAcademicYears = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        let school = await (prisma as any).school.findUnique({ where: { organizationId } });

        if (!school) {
            const org: any = await prisma.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION' || ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(req.user?.role || '')) {
                school = await (prisma as any).school.create({
                    data: { organizationId }
                });
            } else {
                return res.json([]);
            }
        }

        let years = await prisma.academicYear.findMany({
            where: { schoolId: school.id },
            include: { terms: true },
            orderBy: { name: 'desc' }
        });

        // Auto-seed default year/terms if empty
        if (years.length === 0) {
            const currentYear = new Date().getFullYear();
            const yearName = `${currentYear}-${currentYear + 1}`;

            const newYear = await prisma.academicYear.create({
                data: {
                    name: yearName,
                    startDate: new Date(`${currentYear}-09-01`),
                    endDate: new Date(`${currentYear + 1}-06-30`),
                    isCurrent: true,
                    schoolId: school.id,
                    terms: {
                        create: [
                            { name: 'Term 1', startDate: new Date(`${currentYear}-09-01`), endDate: new Date(`${currentYear}-12-15`) },
                            { name: 'Term 2', startDate: new Date(`${currentYear + 1}-01-05`), endDate: new Date(`${currentYear + 1}-03-31`) },
                            { name: 'Term 3', startDate: new Date(`${currentYear + 1}-04-15`), endDate: new Date(`${currentYear + 1}-06-30`) }
                        ]
                    }
                },
                include: { terms: true }
            });
            years = [newYear];
        }

        res.json(years);
    } catch (error) {
        next(error);
    }
};

export const getTerms = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        const school = await (prisma as any).school.findUnique({ where: { organizationId } });

        console.log(`[getTerms] Org: ${organizationId}, School: ${school?.id}, YearId: ${req.params.yearId}`);

        if (!school) return res.json([]);

        const { yearId } = req.params;
        const terms = await prisma.term.findMany({
            where: {
                academicYearId: yearId as string
            },
            include: { academicYear: true },
            orderBy: { startDate: 'asc' }
        });

        // Security check
        const filteredTerms = terms.filter((t: any) => t.academicYear.schoolId === school.id);

        console.log(`[getTerms] Found ${filteredTerms.length} terms`);
        res.json(filteredTerms);
    } catch (error) {
        console.error('[getTerms] Error', error);
        next(error);
    }
};
