export type AssignableRole = "admin" | "user" | "readonly";

export function bootstrapRole(
  userCount: number,
  defaultRole: "user" | "readonly" = "user"
): AssignableRole {
  return userCount === 0 ? "admin" : defaultRole;
}
