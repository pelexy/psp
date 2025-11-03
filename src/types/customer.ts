// Customer Management Types

export interface Customer {
  _id?: string;
  customerId?: string;
  customerAccountNumber?: string;
  accountNumber?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  city?: string;
  state?: string;
  lga?: string;
  dateOfBirth?: string;
  gender?: string;
  currentBalance?: number;
  balance?: number;
  totalDebt?: number;
  totalPaid?: number;
  backlogAmount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Service subscriptions
  services?: CustomerService[];

  // Statistics
  pendingInvoices?: number;
  overdueInvoices?: number;
  paidInvoices?: number;
}

export interface CustomerService {
  _id: string;
  serviceName: string;
  collectionName: string;
  amount: number;
  cycleType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  status: 'active' | 'inactive' | 'suspended';
  startDate: string;
  endDate?: string;
}

export interface CustomerInvoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  commissionAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  status: 'pending' | 'overdue' | 'paid' | 'partially_paid' | 'cancelled';
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  description: string;
  cycleNumber: number;
  service: {
    _id: string;
    serviceName: string;
    collectionName: string;
  };
}

export interface CustomerTransaction {
  _id: string;
  transactionReference: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  type: 'payment' | 'refund' | 'adjustment';
  description?: string;
  paymentMethod: 'buypower' | 'bank_transfer' | 'cash' | 'card';
  invoice?: {
    _id: string;
    invoiceNumber: string;
  };
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetails extends Customer {
  invoices: CustomerInvoice[];
  transactions: CustomerTransaction[];
  services: CustomerService[];
}

export interface CustomerListResponse {
  success?: boolean;
  customers: Customer[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

export interface CustomerDetailsResponse {
  success: boolean;
  data: CustomerDetails;
}

export interface BulkUploadResponse {
  success: boolean;
  data: {
    successCount: number;
    failedCount: number;
    errors: Array<{
      row: number;
      error: string;
      data: Record<string, unknown>;
    }>;
  };
  message: string;
}

export interface CustomerSearchResponse {
  success: boolean;
  data: Customer;
}
