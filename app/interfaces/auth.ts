export type LoginCredentials = {
	login: string;
	password: string;
};

export type LoginApiResponse = {
	token: string;
	expiresIn: number;
	user: {
		id: string;
		name: string;
		email: string;
		lastLoginAt: string | null;
	};
};