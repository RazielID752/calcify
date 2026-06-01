export type DocumentGeneralAccess = "private" | "public";

export type DocumentShareOwner = {
  id: string;
  name: string;
  email: string;
};

export type DocumentSharedUser = {
  id: string;
  email: string;
  name: string;
  access: "editor";
};

export type DocumentShareSettings = {
  generalAccess: DocumentGeneralAccess;
  owner: DocumentShareOwner | null;
  users: DocumentSharedUser[];
};
