# PSP Admin - Staff Management API

## Overview

PSP admin endpoints to create staff members, view all staff, and monitor waste collection pickups.

**Base URL:** `http://localhost:3000/api`

---

## Authentication

All endpoints require JWT Bearer token.

```http
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Access:** PSP role only

---

## API Endpoints

### 1. Create Staff/Agent

Add a new field staff member. Agent receives login credentials via email.

**Endpoint:** `POST /api/staff`

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "agent@example.com",
  "phone": "08012345678",
  "address": "123 Main Street",
  "state": "Lagos",
  "lga": "Ikeja",
  "city": "Ikeja"
}
```

**Required Fields:**
- `fullName` - Agent's full name
- `email` - Email address (must be unique)
- `phone` - Phone number

**Optional Fields:**
- `address` - Residential address
- `state` - State
- `lga` - Local Government Area
- `city` - City

**Success Response (201):**
```json
{
  "message": "Staff created successfully",
  "staff": {
    "id": "507f1f77bcf86cd799439011",
    "staffId": "STAFF1698765432001",
    "fullName": "John Doe",
    "email": "agent@example.com",
    "phone": "08012345678"
  },
  "credentials": {
    "email": "agent@example.com",
    "temporaryPassword": "Ab3Def8Ghj"
  }
}
```

**Error Response (409 - Email exists):**
```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

**Note:** Agent receives welcome email with login credentials.

---

### 2. Get All Staff

View all staff members for your PSP.

**Endpoint:** `GET /api/staff`

**Request:** No body required

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "staffId": "STAFF1698765432001",
    "fullName": "John Doe",
    "email": "agent@example.com",
    "phone": "08012345678",
    "status": "active",
    "isActive": true,
    "createdAt": "2025-11-01T10:30:00.000Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "staffId": "STAFF1698765432002",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "08087654321",
    "status": "active",
    "isActive": true,
    "createdAt": "2025-11-01T09:15:00.000Z"
  }
]
```

**Response Fields:**
- `id` - MongoDB ObjectId
- `staffId` - Unique identifier (STAFF + timestamp + random)
- `fullName` - Agent's name
- `email` - Agent's email
- `phone` - Phone number
- `status` - "active", "inactive", or "suspended"
- `isActive` - Account active status
- `createdAt` - Creation timestamp

---

### 3. Get All Pickups

View all waste pickups confirmed by your agents.

**Endpoint:** `GET /api/staff/collections?limit=50`

**Query Parameters:**
- `limit` (optional) - Number of records to return (default: 50)

**Request Examples:**
```
GET /api/staff/collections
GET /api/staff/collections?limit=100
```

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "customer": {
      "name": "Alice Johnson",
      "accountNumber": "CUST12345678"
    },
    "staff": {
      "name": "John Doe",
      "staffId": "STAFF1698765432001"
    },
    "collectionDate": "2025-11-01T12:00:00.000Z",
    "location": "456 Customer Street, Lagos",
    "notes": "Collected 2 bags of waste",
    "emailSent": true
  },
  {
    "id": "507f1f77bcf86cd799439015",
    "customer": {
      "name": "Bob Williams",
      "accountNumber": "CUST87654321"
    },
    "staff": {
      "name": "Jane Smith",
      "staffId": "STAFF1698765432002"
    },
    "collectionDate": "2025-10-31T15:30:00.000Z",
    "location": "789 Another Street, Lagos",
    "notes": null,
    "emailSent": true
  }
]
```

**Response Fields:**
- `id` - Collection record ID
- `customer.name` - Customer name
- `customer.accountNumber` - Customer account number
- `staff.name` - Agent who confirmed pickup
- `staff.staffId` - Agent's staff ID
- `collectionDate` - When pickup was confirmed
- `location` - Customer's address
- `notes` - Optional notes from agent
- `emailSent` - Whether customer received email

---

## Frontend Integration

### React Example - Create Staff

```jsx
import { useState } from 'react';

const CreateStaff = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    lga: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Staff created! Temporary password: ${data.credentials.temporaryPassword}`);
        // Reset form
        setFormData({
          fullName: '', email: '', phone: '',
          address: '', state: '', lga: '', city: ''
        });
      } else {
        alert(data.message || 'Error creating staff');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Staff</h2>

      <input
        type="text"
        placeholder="Full Name *"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
      />

      <input
        type="email"
        placeholder="Email *"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />

      <input
        type="tel"
        placeholder="Phone *"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
      />

      <input
        type="text"
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
      />

      <input
        type="text"
        placeholder="State"
        value={formData.state}
        onChange={(e) => setFormData({...formData, state: e.target.value})}
      />

      <input
        type="text"
        placeholder="LGA"
        value={formData.lga}
        onChange={(e) => setFormData({...formData, lga: e.target.value})}
      />

      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={(e) => setFormData({...formData, city: e.target.value})}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Staff'}
      </button>
    </form>
  );
};

export default CreateStaff;
```

---

### React Example - List All Staff

```jsx
import { useState, useEffect } from 'react';

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/staff', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStaff(data);
      } else {
        alert('Error loading staff');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>All Staff Members</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id}>
                <td>{member.staffId}</td>
                <td>{member.fullName}</td>
                <td>{member.email}</td>
                <td>{member.phone}</td>
                <td>
                  <span className={`badge badge-${member.status}`}>
                    {member.status}
                  </span>
                </td>
                <td>{new Date(member.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StaffList;
```

---

### React Example - View All Pickups

```jsx
import { useState, useEffect } from 'react';

const PickupHistory = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadPickups();
  }, [limit]);

  const loadPickups = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/staff/collections?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setPickups(data);
      } else {
        alert('Error loading pickups');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Waste Collection History</h2>

      <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
        <option value={25}>25 records</option>
        <option value={50}>50 records</option>
        <option value={100}>100 records</option>
      </select>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Agent</th>
              <th>Location</th>
              <th>Notes</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {pickups.map(pickup => (
              <tr key={pickup.id}>
                <td>{new Date(pickup.collectionDate).toLocaleString()}</td>
                <td>
                  {pickup.customer.name}<br />
                  <small>{pickup.customer.accountNumber}</small>
                </td>
                <td>
                  {pickup.staff.name}<br />
                  <small>{pickup.staff.staffId}</small>
                </td>
                <td>{pickup.location}</td>
                <td>{pickup.notes || '-'}</td>
                <td>{pickup.emailSent ? '✓ Sent' : '✗ Failed'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PickupHistory;
```

---

## Testing with cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"psp@example.com","password":"yourpassword"}'

# Copy the access_token from response

# 2. Create staff
curl -X POST http://localhost:3000/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "agent@test.com",
    "phone": "08012345678",
    "address": "123 Main Street",
    "state": "Lagos"
  }'

# 3. Get all staff
curl -X GET http://localhost:3000/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Get all pickups (default 50)
curl -X GET http://localhost:3000/api/staff/collections \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 5. Get 100 pickups
curl -X GET "http://localhost:3000/api/staff/collections?limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 201 | Created | Resource created successfully |
| 401 | Unauthorized | Token expired, redirect to login |
| 403 | Forbidden | User doesn't have PSP role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already exists |
| 500 | Server Error | Show error message |

### Error Response Format

```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

### Frontend Error Handler

```javascript
const handleApiError = (response, data) => {
  switch (response.status) {
    case 401:
      localStorage.clear();
      window.location.href = '/login';
      break;
    case 403:
      alert('You do not have permission to access this resource');
      break;
    case 404:
      alert('Resource not found');
      break;
    case 409:
      alert(data.message || 'Resource already exists');
      break;
    case 500:
      alert('Server error. Please try again later');
      break;
    default:
      alert(data.message || 'An error occurred');
  }
};
```

---

## Email Notifications

### Staff Credentials Email

Automatically sent when you create a new staff member.

**Subject:** "Your Staff Account Has Been Created"

**Content:**
- Welcome message
- Login credentials (email and temporary password)
- Staff ID
- Your company name
- Security tips

### Pickup Confirmation Email

Automatically sent to customer when agent confirms pickup.

**Subject:** "Waste Collection Confirmation - {Your Company}"

**Content:**
- Collection date and time
- Agent name
- Customer's address
- Notes from agent
- Your company name

---

## Features Summary

✅ Create staff members with auto-generated credentials
✅ View all staff in a single list
✅ Monitor all waste collection pickups
✅ Track which agent confirmed each pickup
✅ See email delivery status for customer notifications
✅ Filter pickups by number of records
✅ All operations secured with JWT authentication

---

## API Summary Table

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/staff` | POST | Create staff | Staff details + credentials |
| `/api/staff` | GET | List all staff | Array of staff members |
| `/api/staff/collections` | GET | View all pickups | Array of collections |

---

**Last Updated:** November 1, 2025
**Version:** 1.0.0
**Documentation:** http://localhost:3000/swagger
