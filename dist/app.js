"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const organizations_routes_1 = __importDefault(require("./modules/organizations/organizations.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Main Routes
app.use('/auth', auth_routes_1.default);
app.use('/documents', documents_routes_1.default);
app.use('/organizations', organizations_routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
