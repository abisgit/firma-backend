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
const templates_routes_1 = __importDefault(require("./modules/templates/templates.routes"));
const stamps_routes_1 = __importDefault(require("./modules/stamps/stamps.routes"));
const letters_routes_1 = __importDefault(require("./modules/letters/letters.routes"));
const hr_routes_1 = __importDefault(require("./modules/hr/hr.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const messages_routes_1 = __importDefault(require("./modules/messages/messages.routes"));
const marketing_routes_1 = __importDefault(require("./modules/marketing/marketing.routes"));
const tenants_routes_1 = __importDefault(require("./modules/tenants/tenants.routes"));
const students_routes_1 = __importDefault(require("./modules/students/students.routes"));
const path_1 = __importDefault(require("path"));
// ... imports
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false })); // Allow loading images
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public', 'uploads')));
// Main Routes
app.use('/auth', auth_routes_1.default);
app.use('/documents', documents_routes_1.default);
app.use('/organizations', organizations_routes_1.default);
app.use('/templates', templates_routes_1.default);
app.use('/stamps', stamps_routes_1.default);
app.use('/letters', letters_routes_1.default);
app.use('/users', users_routes_1.default);
app.use('/messages', messages_routes_1.default);
app.use('/marketing', marketing_routes_1.default);
app.use('/tenants', tenants_routes_1.default);
app.use('/hr', hr_routes_1.default);
app.use('/students', students_routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
