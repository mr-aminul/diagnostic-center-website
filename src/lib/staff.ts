export const STAFF_ROLES = ["ADMIN", "STAFF", "TECHNICIAN"] as const;
export type StaffRoleValue = (typeof STAFF_ROLES)[number];

export const STAFF_DEPARTMENTS = [
  "RECEPTION",
  "LABORATORY",
  "RADIOLOGY",
  "SAMPLE_COLLECTION",
  "BILLING",
  "ADMINISTRATION",
  "CUSTOMER_CARE",
] as const;
export type StaffDepartmentValue = (typeof STAFF_DEPARTMENTS)[number];

export const STAFF_ROLE_LABELS: Record<StaffRoleValue, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  TECHNICIAN: "Technician",
};

export const STAFF_DEPARTMENT_LABELS: Record<StaffDepartmentValue, string> = {
  RECEPTION: "Reception",
  LABORATORY: "Laboratory",
  RADIOLOGY: "Radiology",
  SAMPLE_COLLECTION: "Sample collection",
  BILLING: "Billing",
  ADMINISTRATION: "Administration",
  CUSTOMER_CARE: "Customer care",
};
