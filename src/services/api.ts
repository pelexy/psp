// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://payapi.buypowerpass.africa/api';

// Response when temporary password needs to be changed
export interface TemporaryPasswordResponse {
  requirePasswordChange: true;
  message: string;
  changePasswordToken: string;
  email: string;
  role: string;
}

// Response for successful normal login
export interface NormalLoginResponse {
  status: string;
  message: string;
  data: {
    user: {
      _id: string;
      email: string;
      role: string;
      isActive: boolean;
      isTemporaryPassword?: boolean;
    };
    psp: {
      _id: string;
      companyName: string;
      email: string;
      phone: string;
      address: string;
      businessType: string;
      registrationNumber: string;
      taxId: string;
      isActive: boolean;
      website?: string;
      supportEmail?: string;
      supportPhone?: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

// Union type for login responses
export type LoginResponse = NormalLoginResponse | TemporaryPasswordResponse;

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  status: string;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  status: string;
  message: string;
}

export interface PSPDashboardResponse {
  companyName: string;
  phone: string;
  address: string;
  location: string;
  state: string;
  lga: string;
  isActive: boolean;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  commissionType: string;
  commissionValue: number;
  commissionPayer: string;
}

export interface DashboardStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalCustomers: number;
      activeCustomers: number;
      inactiveCustomers: number;
      totalInvoices: number;
      totalRevenue: number;
      totalOutstanding: number;
      totalCollected: number;
      collectionRate: number;
    };
    invoiceBreakdown: {
      pending: number;
      overdue: number;
      paid: number;
      partiallyPaid: number;
      pendingAmount: number;
      overdueAmount: number;
      paidAmount: number;
      partiallyPaidAmount: number;
    };
    transactionStats: {
      totalTransactions: number;
      successfulTransactions: number;
      pendingTransactions: number;
      failedTransactions: number;
      totalTransactionValue: number;
      averageTransactionValue: number;
    };
    customerMetrics: {
      newCustomersThisMonth: number;
      customersWithDebt: number;
      customersWithBacklog: number;
      averageDebtPerCustomer: number;
      totalBacklogAmount: number;
    };
    revenueMetrics: {
      expectedRevenue: number;
      collectedRevenue: number;
      outstandingRevenue: number;
      collectionEfficiency: number;
      averageRevenuePerCustomer: number;
    };
    periodComparison: {
      currentPeriod: {
        startDate: string;
        endDate: string;
        revenue: number;
        invoices: number;
        customers: number;
      };
      previousPeriod: {
        startDate: string;
        endDate: string;
        revenue: number;
        invoices: number;
        customers: number;
      };
      growth: {
        revenueGrowth: number;
        invoiceGrowth: number;
        customerGrowth: number;
      };
    };
  };
}

export interface RecentTransactionsResponse {
  success: boolean;
  data: Array<{
    _id: string;
    transactionReference: string;
    amount: number;
    status: string;
    type: string;
    customerId: {
      _id: string;
      fullName: string;
      customerAccountNumber: string;
    };
    invoiceId: {
      _id: string;
      invoiceNumber: string;
    };
    paidAt: string | null;
    createdAt: string;
  }>;
}

export interface MonthlyRevenueResponse {
  success: boolean;
  data: Array<{
    month: string;
    monthName: string;
    revenue: number;
    invoices: number;
    collectionRate: number;
    growth: number;
  }>;
}

export interface HighestDebtCustomersResponse {
  success: boolean;
  data: Array<{
    _id: string;
    customerAccountNumber: string;
    fullName: string;
    phone: string;
    email: string;
    currentBalance: number;
    totalDebt: number;
    totalPaid: number;
    overdueInvoices: number;
    pendingInvoices: number;
  }>;
}

export interface BestPayingCustomersResponse {
  success: boolean;
  data: Array<{
    _id: string;
    customerAccountNumber: string;
    fullName: string;
    phone: string;
    email: string;
    totalPaid: number;
    totalDebt: number;
    currentBalance: number;
    paidInvoices: number;
    overdueInvoices: number;
    onTimePaymentRate: number;
  }>;
}

export class ApiError extends Error {
  statusCode: number;
  error?: string;

  constructor(
    statusCode: number,
    message: string,
    error?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use default error
        errorData = {
          message: `Server error: ${response.status} ${response.statusText}`,
          statusCode: response.status,
          error: response.statusText,
        };
      }

      throw new ApiError(
        errorData.statusCode || response.status,
        errorData.message || `Request failed with status ${response.status}`,
        errorData.error || response.statusText
      );
    }

    try {
      return await response.json();
    } catch (e) {
      throw new ApiError(
        500,
        'Failed to parse server response',
        'Invalid JSON'
      );
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const url = `${this.baseUrl}/auth/login`;
    console.log('Login request to:', url);
    console.log('Request body:', { email, password: '***' });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response status:', response.status);
    return this.handleResponse<LoginResponse>(response);
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    accessToken: string
  ): Promise<ChangePasswordResponse> {
    const response = await fetch(`${this.baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    return this.handleResponse<ChangePasswordResponse>(response);
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    return this.handleResponse<ForgotPasswordResponse>(response);
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ChangePasswordResponse> {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    return this.handleResponse<ChangePasswordResponse>(response);
  }

  // Method to make authenticated requests
  async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken: string
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<T>(response);
  }

  // Dashboard API methods
  async getPSPDashboard(accessToken: string): Promise<PSPDashboardResponse> {
    return this.makeAuthenticatedRequest<PSPDashboardResponse>('/psp/dashboard', {}, accessToken);
  }

  async getDashboardStats(accessToken: string, startDate?: string, endDate?: string): Promise<DashboardStatsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const endpoint = `/psp/dashboard/stats${queryString ? `?${queryString}` : ''}`;

    return this.makeAuthenticatedRequest<DashboardStatsResponse>(endpoint, {}, accessToken);
  }

  async getRecentTransactions(accessToken: string): Promise<RecentTransactionsResponse> {
    return this.makeAuthenticatedRequest<RecentTransactionsResponse>(
      '/psp/dashboard/recent-transactions',
      {},
      accessToken
    );
  }

  async getMonthlyRevenue(accessToken: string, months: number = 6): Promise<MonthlyRevenueResponse> {
    return this.makeAuthenticatedRequest<MonthlyRevenueResponse>(
      `/psp/dashboard/monthly-revenue?months=${months}`,
      {},
      accessToken
    );
  }

  async getHighestDebtCustomers(accessToken: string): Promise<HighestDebtCustomersResponse> {
    return this.makeAuthenticatedRequest<HighestDebtCustomersResponse>(
      '/psp/dashboard/highest-debt-customers',
      {},
      accessToken
    );
  }

  async getBestPayingCustomers(accessToken: string): Promise<BestPayingCustomersResponse> {
    return this.makeAuthenticatedRequest<BestPayingCustomersResponse>(
      '/psp/dashboard/best-paying-customers',
      {},
      accessToken
    );
  }

  // Customer Management API methods
  async getCustomers(
    accessToken: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      searchTerm?: string;
      isActive?: boolean;
      state?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<import('@/types/customer').CustomerListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.state) params.append('state', filters.state);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = `/psp/customers${queryString ? `?${queryString}` : ''}`;

    console.log('API Request URL:', `${this.baseUrl}${endpoint}`);
    console.log('Query parameters:', queryString);

    return this.makeAuthenticatedRequest<import('@/types/customer').CustomerListResponse>(
      endpoint,
      {},
      accessToken
    );
  }

  async getCustomerDetails(
    accessToken: string,
    accountNumber: string
  ): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `/psp/customers/${accountNumber}`,
      {},
      accessToken
    );
  }

  async getCustomerInvoices(
    accessToken: string,
    accountNumber: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      collectionId?: string;
      isBacklog?: boolean;
      invoiceNumber?: string;
      startDate?: string;
      endDate?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      paidDateFrom?: string;
      paidDateTo?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.collectionId) params.append('collectionId', filters.collectionId);
      if (filters.isBacklog !== undefined) params.append('isBacklog', filters.isBacklog.toString());
      if (filters.invoiceNumber) params.append('invoiceNumber', filters.invoiceNumber);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
      if (filters.paidDateFrom) params.append('paidDateFrom', filters.paidDateFrom);
      if (filters.paidDateTo) params.append('paidDateTo', filters.paidDateTo);
      if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = `/psp/customers/${accountNumber}/invoices${queryString ? `?${queryString}` : ''}`;

    return this.makeAuthenticatedRequest<any>(endpoint, {}, accessToken);
  }

  async getCustomerTransactions(
    accessToken: string,
    accountNumber: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      type?: string;
      invoiceId?: string;
      invoiceNumber?: string;
      transactionReference?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
      paidDateFrom?: string;
      paidDateTo?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.invoiceId) params.append('invoiceId', filters.invoiceId);
      if (filters.invoiceNumber) params.append('invoiceNumber', filters.invoiceNumber);
      if (filters.transactionReference) params.append('transactionReference', filters.transactionReference);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.paidDateFrom) params.append('paidDateFrom', filters.paidDateFrom);
      if (filters.paidDateTo) params.append('paidDateTo', filters.paidDateTo);
      if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = `/psp/customers/${accountNumber}/transactions${queryString ? `?${queryString}` : ''}`;

    return this.makeAuthenticatedRequest<any>(endpoint, {}, accessToken);
  }

  async searchCustomerByAccountNumber(
    accessToken: string,
    accountNumber: string
  ): Promise<any> {
    // Use the same endpoint as getCustomerDetails
    return this.getCustomerDetails(accessToken, accountNumber);
  }

  async bulkUploadCustomers(
    accessToken: string,
    customers: any[]
  ): Promise<import('@/types/customer').BulkUploadResponse> {
    const response = await fetch(`${this.baseUrl}/customers/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customers }),
    });

    return this.handleResponse<import('@/types/customer').BulkUploadResponse>(response);
  }

  async deleteCustomer(
    accessToken: string,
    customerId: string
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // DELETE might return 204 No Content, handle it specially
    if (response.status === 204 || response.status === 200) {
      return { success: true, message: 'Customer deleted successfully' };
    }

    return this.handleResponse<any>(response);
  }

  // Collection APIs
  async getCollections(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>('/collections', {}, accessToken);
  }

  async getCollection(accessToken: string, collectionId: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>(`/collections/${collectionId}`, {}, accessToken);
  }

  async createCollection(accessToken: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  async enrollCustomers(accessToken: string, collectionId: string, customers: any[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/collections/${collectionId}/enroll`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customers }),
    });

    return this.handleResponse<any>(response);
  }

  async getCollectionMembers(
    accessToken: string,
    collectionId: string,
    page: number = 1,
    limit: number = 20,
    filters?: any
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/collections/${collectionId}/members${queryString ? `?${queryString}` : ''}`;

    return this.makeAuthenticatedRequest<any>(endpoint, {}, accessToken);
  }

  async getCollectionCycles(accessToken: string, collectionId: string, cycleNumber?: number): Promise<any> {
    const params = cycleNumber ? `?cycleNumber=${cycleNumber}` : '';
    return this.makeAuthenticatedRequest<any>(`/collections/${collectionId}/cycles${params}`, {}, accessToken);
  }

  async getCollectionBillingCycles(
    accessToken: string,
    collectionId: string,
    cycleNumber?: number
  ): Promise<any> {
    const params = cycleNumber ? `?cycleNumber=${cycleNumber}` : '';
    return this.makeAuthenticatedRequest<any>(`/collections/${collectionId}/cycles${params}`, {}, accessToken);
  }

  async toggleAutoGenerate(
    accessToken: string,
    collectionId: string,
    accountNumber: string
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/collections/${collectionId}/customers/${accountNumber}/toggle-auto-generate`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return this.handleResponse<any>(response);
  }

  async getCollectionsDropdown(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>('/collections/dropdown', {}, accessToken);
  }

  async getCustomersDropdown(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>('/psp/customers/dropdown', {}, accessToken);
  }

  // Invoice methods
  async getInvoices(accessToken: string, page: number = 1, limit: number = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    const queryString = params.toString();
    return this.makeAuthenticatedRequest<any>(`/psp/invoices${queryString ? `?${queryString}` : ''}`, {}, accessToken);
  }

  async createSingleInvoice(accessToken: string, invoiceData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/psp/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    return this.handleResponse<any>(response);
  }

  async createBulkInvoices(accessToken: string, invoices: any[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/psp/invoices/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoices }),
    });
    return this.handleResponse<any>(response);
  }

  async getJobStatus(accessToken: string, jobId: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>(`/queue/invoice/${jobId}`, {}, accessToken);
  }

  // Wallet and Stats methods
  async getWalletBalance(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>('/psp/wallet/balance', {}, accessToken);
  }

  async getCollectionStats(accessToken: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/collection-stats${queryString ? `?${queryString}` : ''}`,
      {},
      accessToken
    );
  }

  async lockWallet(accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/psp/wallet/lock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse<any>(response);
  }

  async initiateWalletUnlock(accessToken: string, email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/psp/wallet/unlock/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<any>(response);
  }

  async confirmWalletUnlock(accessToken: string, otpCode: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/psp/wallet/unlock/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otpCode }),
    });
    return this.handleResponse<any>(response);
  }

  // Staff/Agent methods
  async createStaff(accessToken: string, staffData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/staff`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(staffData),
    });
    return this.handleResponse<any>(response);
  }

  async getAllStaff(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>('/staff', {}, accessToken);
  }

  async getAllPickups(accessToken: string, limit: number = 50): Promise<any> {
    return this.makeAuthenticatedRequest<any>(`/staff/collections?limit=${limit}`, {}, accessToken);
  }

  // PSP Dashboard API Methods (from PSP_DASHBOARD_API_DOCUMENTATION.md)

  /**
   * GET /api/psp/dashboard/comprehensive
   * Comprehensive dashboard with period comparisons
   */
  async getComprehensiveDashboard(
    accessToken: string,
    startDate?: string,
    endDate?: string,
    days?: number
  ): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (days) params.append('days', days.toString());

    const queryString = params.toString();
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/comprehensive${queryString ? `?${queryString}` : ''}`,
      {},
      accessToken
    );
  }

  /**
   * GET /api/psp/dashboard/performance
   * Performance metrics (waste, pickups, invoices)
   */
  async getPerformanceMetrics(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      '/psp/dashboard/performance',
      {},
      accessToken
    );
  }

  /**
   * GET /api/psp/dashboard/revenue-performance
   * Monthly revenue chart (Jan-Dec for year)
   */
  async getRevenuePerformance(accessToken: string, year?: number): Promise<any> {
    const params = year ? `?year=${year}` : '';
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/revenue-performance${params}`,
      {},
      accessToken
    );
  }

  /**
   * GET /api/psp/dashboard/top-performing-agents
   * Top performing agents with PSP-wide summary
   */
  async getTopPerformingAgents(accessToken: string, limit: number = 5): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/top-performing-agents?limit=${limit}`,
      {},
      accessToken
    );
  }

  /**
   * GET /api/psp/dashboard/collection-services
   * Top revenue-generating collection services
   */
  async getCollectionServicesDashboard(accessToken: string, limit: number = 3): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/collection-services?limit=${limit}`,
      {},
      accessToken
    );
  }

  /**
   * GET /api/psp/dashboard/top-customers
   * Top customers by total amount paid
   */
  async getTopCustomersDashboard(accessToken: string, limit: number = 5): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/top-customers?limit=${limit}`,
      {},
      accessToken
    );
  }

  /**
   * GET /api/psp/dashboard/recent-transactions-psp
   * Last 5 wallet transactions
   */
  async getRecentTransactionsPSP(accessToken: string, limit: number = 5): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `/psp/dashboard/recent-transactions-psp?limit=${limit}`,
      {},
      accessToken
    );
  }
}

export const apiService = new ApiService(API_BASE_URL);
