import { api } from "./client.js";

export interface RoleUpgrade {
  role: "founder" | "investor" | "community_leader" | "vendor" | "capital_partner";
  dotCost: number;
  requiredFields: string[];
  description: string | null;
}

export const rolesApi = {
  list: () => api.get<{ requirements: RoleUpgrade[] }>("/api/users/roles/requirements"),
  upgrade: (role: RoleUpgrade["role"]) =>
    api.post<{ user: any }>("/api/users/roles", { role }),
};
