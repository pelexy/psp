export interface FilterOptions {
  isActive?: "all" | "true" | "false";
  state?: string;
  lga?: string;
  hasOutstanding?: "all" | "true"; // "true" = only customers who owe
  paymentBehavior?: "" | "excellent" | "good" | "needs_attention";
  customerType?: "all" | "standalone" | "compound" | "estate" | "commercial";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
