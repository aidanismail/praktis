export type UserRole = "superadmin" | "asprak" | "praktikan";

export type User = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  force_password_change: boolean;
};
