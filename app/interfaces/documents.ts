export type DocumentApiResponse = {
	id: string;
	title: string;
	content: string;
	clientDocumentId?: string | null;
	isDraft: boolean;
	createdAt: string;
	updatedAt: string;
};

export type DocumentListApiResponse = {
	page: number;
	pageSize: number;
	total: number;
	items: DocumentApiResponse[];
};

export type UpsertDocumentPayload = {
	title: string;
	content: string;
	isDraft: boolean;
	clientDocumentId?: string;
};

export type UpsertDocumentOptions = {
	knownUpdatedAt?: string;
};