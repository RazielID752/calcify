export type DocumentGeneralAccess = "private" | "public";
export type DocumentUserAccess = "viewer" | "editor";

export type DocumentShareOwner = {
  id: string;
  name: string;
  email: string;
};

export type DocumentSharedUser = {
  id: string;
  email: string;
  name: string;
  access: DocumentUserAccess;
};

export type DocumentShareSettings = {
  generalAccess: DocumentGeneralAccess;
  owner: DocumentShareOwner | null;
  users: DocumentSharedUser[];
};
