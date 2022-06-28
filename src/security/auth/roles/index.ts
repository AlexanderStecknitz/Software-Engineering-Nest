/**
 * Das Modul besteht aus den Klassen für RBAC (= roles-based access control).
 * @packageDocumentation
 */

export { ROLES_KEY, Roles } from './roles.decorator.js';
export { RolesGuard } from './roles.guard.js';
export { RolesGraphQlGuard } from './roles-graphql.guard.js';
