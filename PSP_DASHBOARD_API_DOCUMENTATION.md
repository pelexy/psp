# PSP Dashboard API Documentation for Frontend Integration

## Base URL
```
/api/psp/dashboard
```

## Authentication
All endpoints require:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## 1. Comprehensive Dashboard

**Endpoint:** `GET /api/psp/dashboard/comprehensive`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Number of days to look back (default: 30) |
| startDate | string | No | Start date (YYYY-MM-DD format) |
| endDate | string | No | End date (YYYY-MM-DD format) |

**Request Examples:**
```
GET /api/psp/dashboard/comprehensive?days=30
GET /api/psp/dashboard/comprehensive?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "message": "Comprehensive dashboard retrieved successfully",
  "data": {
    "invoiceSummary": {
      "paid": {
        "amount": 1500000.50,
        "count": 145
      },
      "pending": {
        "amount": 250000.00,
        "count": 32
      },
      "overdue": {
        "amount": 75000.00,
        "count": 8
      }
    },
    "totalRevenue": {
      "currentPeriod": {
        "amount": 1500000.50,
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-01-31T23:59:59.999Z"
      },
      "previousPeriod": {
        "amount": 1200000.00,
        "startDate": "2024-12-01T00:00:00.000Z",
        "endDate": "2024-12-31T23:59:59.999Z"
      },
      "changePercentage": 25.0,
      "changeAmount": 300000.50
    },
    "outstandingBalance": {
      "totalAmount": 325000.00,
      "overdueInvoiceCount": 8
    },
    "activeCustomers": {
      "active": 450,
      "inactive": 50,
      "total": 500,
      "newInPeriod": 25,
      "newInPreviousPeriod": 18,
      "changeCount": 7
    },
    "collectionEfficiency": {
      "currentPeriod": {
        "percentage": 85.7,
        "collected": 1500000.50,
        "invoiced": 1750000.00
      },
      "previousPeriod": {
        "percentage": 80.5,
        "collected": 1200000.00,
        "invoiced": 1490000.00
      },
      "improvementPercentage": 5.2
    },
    "periodDays": 30
  }
}
```

**TypeScript Interface:**
```typescript
interface ComprehensiveDashboardResponse {
  success: boolean;
  message: string;
  data: {
    invoiceSummary: {
      paid: { amount: number; count: number };
      pending: { amount: number; count: number };
      overdue: { amount: number; count: number };
    };
    totalRevenue: {
      currentPeriod: { amount: number; startDate: string; endDate: string };
      previousPeriod: { amount: number; startDate: string; endDate: string };
      changePercentage: number;
      changeAmount: number;
    };
    outstandingBalance: {
      totalAmount: number;
      overdueInvoiceCount: number;
    };
    activeCustomers: {
      active: number;
      inactive: number;
      total: number;
      newInPeriod: number;
      newInPreviousPeriod: number;
      changeCount: number;
    };
    collectionEfficiency: {
      currentPeriod: { percentage: number; collected: number; invoiced: number };
      previousPeriod: { percentage: number; collected: number; invoiced: number };
      improvementPercentage: number;
    };
    periodDays: number;
  };
}
```

---

## 2. Performance Metrics

**Endpoint:** `GET /api/psp/dashboard/performance`

**Query Parameters:** None

**Request Example:**
```
GET /api/psp/dashboard/performance
```

**Response:**
```json
{
  "success": true,
  "message": "Performance metrics retrieved successfully",
  "data": {
    "wasteCollections": {
      "thisMonth": {
        "total": 850,
        "averagePerDay": 28.3
      },
      "previousMonth": {
        "total": 720,
        "averagePerDay": 24.0
      },
      "changePercentage": 18.1
    },
    "pickupSuccessRate": {
      "percentage": 92.5,
      "confirmedPickups": 785,
      "totalPickups": 850,
      "changePercentage": 3.2
    },
    "totalInvoices": {
      "total": 1250,
      "totalValue": 5250000.00,
      "thisMonth": 145,
      "thisMonthValue": 1750000.00
    },
    "pendingInvoices": {
      "count": 32,
      "totalValue": 250000.00
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface PerformanceMetricsResponse {
  success: boolean;
  message: string;
  data: {
    wasteCollections: {
      thisMonth: { total: number; averagePerDay: number };
      previousMonth: { total: number; averagePerDay: number };
      changePercentage: number;
    };
    pickupSuccessRate: {
      percentage: number;
      confirmedPickups: number;
      totalPickups: number;
      changePercentage: number;
    };
    totalInvoices: {
      total: number;
      totalValue: number;
      thisMonth: number;
      thisMonthValue: number;
    };
    pendingInvoices: {
      count: number;
      totalValue: number;
    };
  };
}
```

---

## 3. Revenue Performance Chart

**Endpoint:** `GET /api/psp/dashboard/revenue-performance`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | No | Year for revenue data (default: current year) |

**Request Example:**
```
GET /api/psp/dashboard/revenue-performance?year=2025
```

**Response:**
```json
{
  "success": true,
  "message": "Revenue performance data retrieved successfully",
  "data": {
    "summary": {
      "totalInvoiced": 18500000.00,
      "totalCollected": 15800000.00,
      "overallEfficiency": 85.4
    },
    "monthlyData": [
      {
        "month": "Jan",
        "year": 2025,
        "invoicedAmount": 1500000.00,
        "collectedAmount": 1280000.00,
        "efficiency": 85.3
      },
      {
        "month": "Feb",
        "year": 2025,
        "invoicedAmount": 1600000.00,
        "collectedAmount": 1400000.00,
        "efficiency": 87.5
      },
      {
        "month": "Mar",
        "year": 2025,
        "invoicedAmount": 1550000.00,
        "collectedAmount": 1320000.00,
        "efficiency": 85.2
      },
      {
        "month": "Apr",
        "year": 2025,
        "invoicedAmount": 1580000.00,
        "collectedAmount": 1350000.00,
        "efficiency": 85.4
      },
      {
        "month": "May",
        "year": 2025,
        "invoicedAmount": 1620000.00,
        "collectedAmount": 1390000.00,
        "efficiency": 85.8
      },
      {
        "month": "Jun",
        "year": 2025,
        "invoicedAmount": 1570000.00,
        "collectedAmount": 1340000.00,
        "efficiency": 85.4
      },
      {
        "month": "Jul",
        "year": 2025,
        "invoicedAmount": 1590000.00,
        "collectedAmount": 1360000.00,
        "efficiency": 85.5
      },
      {
        "month": "Aug",
        "year": 2025,
        "invoicedAmount": 1540000.00,
        "collectedAmount": 1310000.00,
        "efficiency": 85.1
      },
      {
        "month": "Sep",
        "year": 2025,
        "invoicedAmount": 1560000.00,
        "collectedAmount": 1330000.00,
        "efficiency": 85.3
      },
      {
        "month": "Oct",
        "year": 2025,
        "invoicedAmount": 1580000.00,
        "collectedAmount": 1350000.00,
        "efficiency": 85.4
      },
      {
        "month": "Nov",
        "year": 2025,
        "invoicedAmount": 1600000.00,
        "collectedAmount": 1370000.00,
        "efficiency": 85.6
      },
      {
        "month": "Dec",
        "year": 2025,
        "invoicedAmount": 1610000.00,
        "collectedAmount": 1380000.00,
        "efficiency": 85.7
      }
    ],
    "period": "Year 2025"
  }
}
```

**TypeScript Interface:**
```typescript
interface RevenuePerformanceResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      totalInvoiced: number;
      totalCollected: number;
      overallEfficiency: number;
    };
    monthlyData: Array<{
      month: string;
      year: number;
      invoicedAmount: number;
      collectedAmount: number;
      efficiency: number;
    }>;
    period: string;
  };
}
```

---

## 4. Top Performing Agents

**Endpoint:** `GET /api/psp/dashboard/top-performing-agents`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of top agents (default: 5) |

**Request Example:**
```
GET /api/psp/dashboard/top-performing-agents?limit=5
```

**Response:**
```json
{
  "success": true,
  "message": "Top performing agents retrieved successfully",
  "data": {
    "topAgents": [
      {
        "staffId": "STAFF1704567890123",
        "staffName": "John Doe",
        "initials": "JD",
        "pickups": 245,
        "customers": 78
      },
      {
        "staffId": "STAFF1704567890456",
        "staffName": "Jane Smith",
        "initials": "JS",
        "pickups": 230,
        "customers": 72
      },
      {
        "staffId": "STAFF1704567890789",
        "staffName": "Michael Johnson",
        "initials": "MJ",
        "pickups": 215,
        "customers": 68
      },
      {
        "staffId": "STAFF1704567891012",
        "staffName": "Sarah Williams",
        "initials": "SW",
        "pickups": 198,
        "customers": 65
      },
      {
        "staffId": "STAFF1704567891345",
        "staffName": "David Brown",
        "initials": "DB",
        "pickups": 185,
        "customers": 60
      }
    ],
    "totalPickups": 1850,
    "successRate": 92.5,
    "totalStaff": 25
  }
}
```

**TypeScript Interface:**
```typescript
interface TopPerformingAgentsResponse {
  success: boolean;
  message: string;
  data: {
    topAgents: Array<{
      staffId: string;
      staffName: string;
      initials: string;
      pickups: number;
      customers: number;
    }>;
    totalPickups: number;
    successRate: number;
    totalStaff: number;
  };
}
```

**Notes:**
- `topAgents` contains only top 5 agents
- `totalPickups`, `successRate`, and `totalStaff` are for **entire PSP**, not just top 5

---

## 5. Collection Services

**Endpoint:** `GET /api/psp/dashboard/collection-services`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of top services (default: 3) |

**Request Example:**
```
GET /api/psp/dashboard/collection-services?limit=3
```

**Response:**
```json
{
  "success": true,
  "message": "Collection services data retrieved successfully",
  "data": {
    "services": [
      {
        "serviceName": "Weekly Waste Collection",
        "count": 350,
        "pricePerUnit": 5000.00,
        "growthPercentage": 15.5,
        "collectionRate": 88.5,
        "invoiced": 1750000.00,
        "collected": 1548750.00
      },
      {
        "serviceName": "Bi-Weekly Collection",
        "count": 280,
        "pricePerUnit": 3000.00,
        "growthPercentage": 12.3,
        "collectionRate": 85.2,
        "invoiced": 840000.00,
        "collected": 715680.00
      },
      {
        "serviceName": "Monthly Collection",
        "count": 150,
        "pricePerUnit": 2000.00,
        "growthPercentage": 8.7,
        "collectionRate": 82.0,
        "invoiced": 300000.00,
        "collected": 246000.00
      }
    ],
    "activeServices": 8
  }
}
```

**TypeScript Interface:**
```typescript
interface CollectionServicesResponse {
  success: boolean;
  message: string;
  data: {
    services: Array<{
      serviceName: string;
      count: number;
      pricePerUnit: number;
      growthPercentage: number;
      collectionRate: number;
      invoiced: number;
      collected: number;
    }>;
    activeServices: number;
  };
}
```

---

## 6. Top Customers

**Endpoint:** `GET /api/psp/dashboard/top-customers`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of top customers (default: 5) |

**Request Example:**
```
GET /api/psp/dashboard/top-customers?limit=5
```

**Response:**
```json
{
  "success": true,
  "message": "Top customers retrieved successfully",
  "data": {
    "topCustomers": [
      {
        "rank": 1,
        "customerName": "ABC Corporation Ltd",
        "accountNumber": "CUST1704567890123",
        "totalPaid": 850000.00,
        "dueAmount": 15000.00
      },
      {
        "rank": 2,
        "customerName": "XYZ Industries",
        "accountNumber": "CUST1704567890456",
        "totalPaid": 720000.00,
        "dueAmount": 25000.00
      },
      {
        "rank": 3,
        "customerName": "Global Enterprises",
        "accountNumber": "CUST1704567890789",
        "totalPaid": 650000.00,
        "dueAmount": 0.00
      },
      {
        "rank": 4,
        "customerName": "Tech Solutions Inc",
        "accountNumber": "CUST1704567891012",
        "totalPaid": 580000.00,
        "dueAmount": 12000.00
      },
      {
        "rank": 5,
        "customerName": "Prime Holdings",
        "accountNumber": "CUST1704567891345",
        "totalPaid": 520000.00,
        "dueAmount": 8000.00
      }
    ]
  }
}
```

**TypeScript Interface:**
```typescript
interface TopCustomersResponse {
  success: boolean;
  message: string;
  data: {
    topCustomers: Array<{
      rank: number;
      customerName: string;
      accountNumber: string;
      totalPaid: number;
      dueAmount: number;
    }>;
  };
}
```

---

## 7. Recent Transactions

**Endpoint:** `GET /api/psp/dashboard/recent-transactions-psp`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of transactions (default: 5) |

**Request Example:**
```
GET /api/psp/dashboard/recent-transactions-psp?limit=5
```

**Response:**
```json
{
  "success": true,
  "message": "Recent transactions retrieved successfully",
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "transactionReference": "TXN1704567890123456",
      "amount": 25000.00,
      "type": "credit",
      "status": "completed",
      "description": "Payment received from customer",
      "balanceBefore": 1500000.00,
      "balanceAfter": 1525000.00,
      "createdAt": "2025-01-15T10:30:45.000Z"
    },
    {
      "_id": "65f1234567890abcdef12346",
      "transactionReference": "TXN1704567890234567",
      "amount": 50000.00,
      "type": "debit",
      "status": "completed",
      "description": "Transfer to beneficiary",
      "balanceBefore": 1525000.00,
      "balanceAfter": 1475000.00,
      "createdAt": "2025-01-15T09:15:20.000Z"
    },
    {
      "_id": "65f1234567890abcdef12347",
      "transactionReference": "TXN1704567890345678",
      "amount": 30000.00,
      "type": "credit",
      "status": "completed",
      "description": "Invoice payment",
      "balanceBefore": 1475000.00,
      "balanceAfter": 1505000.00,
      "createdAt": "2025-01-14T16:45:10.000Z"
    },
    {
      "_id": "65f1234567890abcdef12348",
      "transactionReference": "TXN1704567890456789",
      "amount": 15000.00,
      "type": "credit",
      "status": "completed",
      "description": "Customer payment",
      "balanceBefore": 1490000.00,
      "balanceAfter": 1505000.00,
      "createdAt": "2025-01-14T14:20:35.000Z"
    },
    {
      "_id": "65f1234567890abcdef12349",
      "transactionReference": "TXN1704567890567890",
      "amount": 40000.00,
      "type": "credit",
      "status": "completed",
      "description": "Bulk payment received",
      "balanceBefore": 1450000.00,
      "balanceAfter": 1490000.00,
      "createdAt": "2025-01-13T11:10:25.000Z"
    }
  ]
}
```

**TypeScript Interface:**
```typescript
interface RecentTransactionsResponse {
  success: boolean;
  message: string;
  data: Array<{
    _id: string;
    transactionReference: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
  }>;
}
```

---

## Error Responses

All endpoints return consistent error format:

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "PSP not found",
  "error": "Not Found"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to fetch dashboard data",
  "error": "Internal Server Error"
}
```

---

## Complete API List

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | GET | `/api/psp/dashboard/comprehensive` | Comprehensive dashboard with period comparisons |
| 2 | GET | `/api/psp/dashboard/performance` | Performance metrics (waste, pickups, invoices) |
| 3 | GET | `/api/psp/dashboard/revenue-performance` | Monthly revenue chart (Jan-Dec for year) |
| 4 | GET | `/api/psp/dashboard/top-performing-agents` | Top 5 agents with PSP-wide summary |
| 5 | GET | `/api/psp/dashboard/collection-services` | Top 3 revenue-generating services |
| 6 | GET | `/api/psp/dashboard/top-customers` | Top 5 customers by total amount paid |
| 7 | GET | `/api/psp/dashboard/recent-transactions-psp` | Last 5 wallet transactions |
