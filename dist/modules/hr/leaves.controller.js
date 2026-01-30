"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveStatus = exports.createLeave = exports.getLeaves = void 0;
const db_1 = __importDefault(require("../../config/db"));
const getLeaves = async (req, res, next) => {
    try {
        const { organizationId, role } = req.user;
        let where = {};
        if (role !== 'SUPER_ADMIN') {
            where = {
                employee: {
                    organizationId
                }
            };
        }
        const leaves = await db_1.default.leaveRequest.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        position: true
                    }
                },
                approvedBy: {
                    select: {
                        fullName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    }
    catch (error) {
        next(error);
    }
};
exports.getLeaves = getLeaves;
const createLeave = async (req, res, next) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;
        const leave = await db_1.default.leaveRequest.create({
            data: {
                employeeId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING'
            },
            include: {
                employee: true
            }
        });
        res.status(201).json(leave);
    }
    catch (error) {
        next(error);
    }
};
exports.createLeave = createLeave;
const updateLeaveStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const approvedById = req.user.userId;
        const leave = await db_1.default.leaveRequest.update({
            where: { id: id },
            data: {
                status,
                approvedById: status === 'APPROVED' ? approvedById : undefined
            }
        });
        res.json(leave);
    }
    catch (error) {
        next(error);
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
