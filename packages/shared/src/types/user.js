"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLoginSchema = exports.userRegistrationSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    passwordHash: zod_1.z.string(),
    consentAccepted: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.userRegistrationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, {
        message: 'El nombre debe tener al menos 2 caracteres'
    }).max(100, {
        message: 'El nombre no puede exceder 100 caracteres'
    }),
    email: zod_1.z.string().email({
        message: 'Email inválido'
    }),
    password: zod_1.z.string().min(8, {
        message: 'La contraseña debe tener al menos 8 caracteres'
    }),
    consentAccepted: zod_1.z.boolean().refine((val) => val === true, {
        message: 'Debes aceptar los términos de privacidad para continuar'
    })
});
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email({
        message: 'Email inválido'
    }),
    password: zod_1.z.string().min(1, {
        message: 'La contraseña es requerida'
    })
});
//# sourceMappingURL=user.js.map