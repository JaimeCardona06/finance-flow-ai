import { z } from 'zod';
export declare const userSchema: z.ZodObject<{
    _id: z.ZodString;
    email: z.ZodString;
    passwordHash: z.ZodString;
    consentAccepted: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    createdAt: string;
    updatedAt: string;
    _id: string;
    passwordHash: string;
    consentAccepted: boolean;
}, {
    email: string;
    createdAt: string;
    updatedAt: string;
    _id: string;
    passwordHash: string;
    consentAccepted?: boolean | undefined;
}>;
export type User = z.infer<typeof userSchema>;
export declare const userRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    consentAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    consentAccepted: boolean;
}, {
    name: string;
    email: string;
    password: string;
    consentAccepted: boolean;
}>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type UserLogin = z.infer<typeof userLoginSchema>;
//# sourceMappingURL=user.d.ts.map