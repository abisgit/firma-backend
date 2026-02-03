import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const createClassSchema = z.object({
    name: z.string().min(1),
    grade: z.string().min(1),
    section: z.string().optional(),
    academicYear: z.string().min(4),
    capacity: z.number().int().positive().optional(),
    subjectIds: z.array(z.string()).optional(),
});

const updateClassSchema = z.object({
    name: z.string().min(1).optional(),
    grade: z.string().min(1).optional(),
    section: z.string().optional(),
    academicYear: z.string().min(4).optional(),
    capacity: z.number().int().positive().optional(),
    subjectIds: z.array(z.string()).optional(),
});

export const getClasses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        let school = await (prisma as any).school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            const org: any = await prisma.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'TEACHER') {
                school = await (prisma as any).school.create({
                    data: { organizationId }
                });
            } else {
                return res.status(404).json({ message: 'School profile not found' });
            }
        }

        const classes = await (prisma as any).class.findMany({
            where: { schoolId: school.id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: true }
                        }
                    }
                },
                subjects: {
                    include: {
                        subject: true
                    }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: [{ grade: 'asc' }, { name: 'asc' }]
        });

        res.json(classes);
    } catch (error) {
        next(error);
    }
};

export const createClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { name, grade, section, academicYear, capacity, subjectIds } = createClassSchema.parse(req.body);

        let school = await (prisma as any).school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            const org: any = await prisma.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'TEACHER') {
                school = await (prisma as any).school.create({
                    data: { organizationId }
                });
            } else {
                return res.status(404).json({ message: 'School profile not found' });
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const newClass = await (tx as any).class.create({
                data: {
                    name,
                    grade,
                    section,
                    academicYear,
                    capacity: capacity || 40,
                    schoolId: school.id
                }
            });

            if (subjectIds && subjectIds.length > 0) {
                await (tx as any).classSubject.createMany({
                    data: subjectIds.map(subjectId => ({
                        classId: newClass.id,
                        subjectId
                    }))
                });
            }

            return newClass;
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
export const getClassById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const organizationId = req.user?.organizationId;

        const classDetail = await (prisma as any).class.findUnique({
            where: { id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: { select: { fullName: true, email: true } } }
                        }
                    }
                },
                subjects: {
                    include: {
                        subject: true
                    }
                },
                students: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                phoneNumber: true,
                                isActive: true
                            }
                        }
                    }
                },
                _count: {
                    select: { students: true }
                }
            }
        });

        if (!classDetail) return res.status(404).json({ message: 'Class not found' });

        // Security check: ensure the class belongs to the user's organization school
        const school = await (prisma as any).school.findUnique({ where: { organizationId } });
        if (!school || classDetail.schoolId !== school.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(classDetail);
    } catch (error) {
        next(error);
    }
};

export const updateClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const data = updateClassSchema.parse(req.body);

        const classDetail = await (prisma as any).class.findUnique({
            where: { id }
        });

        if (!classDetail) return res.status(404).json({ message: 'Class not found' });

        const result = await prisma.$transaction(async (tx) => {
            const updatedClass = await (tx as any).class.update({
                where: { id },
                data: {
                    name: data.name,
                    grade: data.grade,
                    section: data.section,
                    academicYear: data.academicYear,
                    capacity: data.capacity
                }
            });

            if (data.subjectIds) {
                await (tx as any).classSubject.deleteMany({
                    where: { classId: id }
                });

                if (data.subjectIds.length > 0) {
                    await (tx as any).classSubject.createMany({
                        data: data.subjectIds.map((subjectId: string) => ({
                            classId: id,
                            subjectId
                        }))
                    });
                }
            }

            return updatedClass;
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

        const existingClass = await (prisma as any).class.findUnique({ where: { id } });
        if (!existingClass) return res.status(404).json({ message: 'Class not found' });

        await prisma.$transaction(async (tx) => {
            // 1. Unassign students
            await (tx as any).student.updateMany({
                where: { classId: id },
                data: { classId: null }
            });

            // 2. Remove subject associations
            await (tx as any).classSubject.deleteMany({
                where: { classId: id }
            });

            // 3. Remove teacher assignments
            await (tx as any).classTeacher.deleteMany({
                where: { classId: id }
            });

            // 4. Remove timetable entries
            await (tx as any).timetable.deleteMany({
                where: { classId: id }
            });

            // 5. Delete the class itself
            await (tx as any).class.delete({
                where: { id }
            });
        });

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        next(error);
    }
};
