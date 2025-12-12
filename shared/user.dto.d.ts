export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: 'superadmin' | 'tenantOwner' | 'manager' | 'editor';
    tenantId?: string;
}
export type UpdateUserDto = Partial<CreateUserDto>;
//# sourceMappingURL=user.dto.d.ts.map