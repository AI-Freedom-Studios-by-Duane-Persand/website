

export interface CreateUserDto {
	name: string;
	email: string;
	password: string;
	role: 'superadmin' | 'tenantOwner' | 'manager' | 'editor';
	tenantId?: string;
	isEarlyAccess?: boolean;
}

export type UpdateUserDto = Partial<CreateUserDto>;
