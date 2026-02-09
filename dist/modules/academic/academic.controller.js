"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTerms = exports.getAcademicYears = void 0;
const db_1 = __importDefault(require("../../config/db"));
const getAcademicYears = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        let school = await db_1.default.school.findUnique({ where: { organizationId } });
        if (!school) {
            const org = await db_1.default.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION' || ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(req.user?.role || '')) {
                school = await db_1.default.school.create({
                    data: { organizationId }
                });
            }
            else {
                return res.json([]);
            }
        }
        let years = await db_1.default.academicYear.findMany({
            where: { schoolId: school.id },
            include: { terms: true },
            orderBy: { name: 'desc' }
        });
        // Auto-seed default year/terms if empty
        if (years.length === 0) {
            const currentYear = new Date().getFullYear();
            const yearName = `${currentYear}-${currentYear + 1}`;
            const newYear = await db_1.default.academicYear.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAcademicYears = getAcademicYears;
const getTerms = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        const school = await db_1.default.school.findUnique({ where: { organizationId } });
        console.log(`[getTerms] Org: ${organizationId}, School: ${school?.id}, YearId: ${req.params.yearId}`);
        if (!school)
            return res.json([]);
        const { yearId } = req.params;
        const terms = await db_1.default.term.findMany({
            where: {
                academicYearId: yearId
            },
            include: { academicYear: true },
            orderBy: { startDate: 'asc' }
        });
        // Security check
        const filteredTerms = terms.filter((t) => t.academicYear.schoolId === school.id);
        console.log(`[getTerms] Found ${filteredTerms.length} terms`);
        res.json(filteredTerms);
    }
    catch (error) {
        console.error('[getTerms] Error', error);
        next(error);
    }
};
exports.getTerms = getTerms;
