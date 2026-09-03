// Single source of truth for Staff RBAC permissions (ERP-standard, grouped by
// module). Used by the Create Staff dialog, the Staff detail editor, and the
// dashboard nav gating. Keys must match the backend Staff.permissions shape
// (staff.entity.ts) and StaffPermissionsDto.

export type PermissionKey =
  // Field / mobile
  | "canUseMobileApp"
  | "canEnumerateCustomers"
  | "canScanBarcodes"
  // Customers
  | "canManageCustomers"
  | "canDeleteCustomers"
  // Billing
  | "canViewInvoices"
  | "canGenerateBills"
  | "canManageBillCycles"
  // Payments
  | "canViewPayments"
  | "canRecordPayments"
  // Reports
  | "canViewReports"
  // Expenses
  | "canViewExpenses"
  | "canManageExpenses"
  // Wallet
  | "canViewWallet"
  | "canWithdrawFunds"
  // Administration
  | "canManageStaff"
  | "canManageSettings";

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  hint: string;
}

export interface PermissionGroup {
  group: string;
  items: PermissionDef[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: "Field / Mobile app",
    items: [
      { key: "canUseMobileApp", label: "Mobile app access", hint: "Master switch — can sign in to the field app" },
      { key: "canEnumerateCustomers", label: "Enumerate customers", hint: "Add new households or businesses in the field" },
      { key: "canScanBarcodes", label: "Scan barcodes", hint: "Use camera to look up customers by barcode" },
    ],
  },
  {
    group: "Customers",
    items: [
      { key: "canManageCustomers", label: "View & manage customers", hint: "See customer list, details, debt; add and edit customers" },
      { key: "canDeleteCustomers", label: "Delete customers", hint: "Deactivate or remove customer records" },
    ],
  },
  {
    group: "Billing",
    items: [
      { key: "canViewInvoices", label: "View bills & debt", hint: "See generated bills, statements and outstanding amounts" },
      { key: "canGenerateBills", label: "Generate bills", hint: "Run bill cycles and generate bills" },
      { key: "canManageBillCycles", label: "Manage bill cycles", hint: "Create/edit cycles and assign customers" },
    ],
  },
  {
    group: "Payments",
    items: [
      { key: "canViewPayments", label: "View payments", hint: "See payment and transaction history" },
      { key: "canRecordPayments", label: "Record payments", hint: "Mark payments collected in the field" },
    ],
  },
  {
    group: "Reports",
    items: [
      { key: "canViewReports", label: "View reports", hint: "Access analytics and reports" },
    ],
  },
  {
    group: "Expenses",
    items: [
      { key: "canViewExpenses", label: "View expenses", hint: "See recorded expenses" },
      { key: "canManageExpenses", label: "Manage expenses", hint: "Add and edit expenses" },
    ],
  },
  {
    group: "Wallet",
    items: [
      { key: "canViewWallet", label: "View wallet", hint: "See wallet balance and history" },
      { key: "canWithdrawFunds", label: "Withdraw funds", hint: "Request payouts from the wallet" },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "canManageStaff", label: "Manage staff", hint: "Create staff and set their permissions" },
      { key: "canManageSettings", label: "Company settings", hint: "Edit company profile and configuration" },
    ],
  },
];

// Flat list of every permission key.
export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key),
);

// Sensible defaults for a new field agent (deny-by-default for sensitive/admin
// modules). Owners bypass permissions entirely.
export const DEFAULT_STAFF_PERMISSIONS: Record<PermissionKey, boolean> = {
  canUseMobileApp: true,
  canEnumerateCustomers: true,
  canScanBarcodes: true,
  canManageCustomers: true,
  canDeleteCustomers: false,
  canViewInvoices: false,
  canGenerateBills: false,
  canManageBillCycles: false,
  canViewPayments: false,
  canRecordPayments: false,
  canViewReports: false,
  canViewExpenses: false,
  canManageExpenses: false,
  canViewWallet: false,
  canWithdrawFunds: false,
  canManageStaff: false,
  canManageSettings: false,
};
