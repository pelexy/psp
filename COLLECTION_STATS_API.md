# Collection Statistics API

## Get Collection Rate and On-Time Payment Statistics

Returns the collection rate percentage and on-time payment statistics for a PSP.

---

### Endpoint

```
GET /api/psp/dashboard/collection-stats
```

### Authentication

**Required:** Yes (JWT Bearer Token)

**Role:** PSP only

---

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601 format: "2025-01-01") |
| endDate | string | No | End date (ISO 8601 format: "2025-12-31") |

---

### Request Example

```bash
# Get all-time statistics
curl -X GET "https://api.yourdomain.com/api/psp/dashboard/collection-stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get statistics for date range
curl -X GET "https://api.yourdomain.com/api/psp/dashboard/collection-stats?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "collectionRate": {
      "percentage": 88.12,
      "totalCollected": 62200000,
      "totalDue": 70600000,
      "formattedCollected": "₦62.2M",
      "formattedDue": "₦70.6M"
    },
    "onTimePayments": {
      "percentage": 75.92,
      "onTimeCount": 186,
      "totalCount": 245,
      "lateCount": 59
    },
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z"
    }
  }
}
```

---

### Response Fields

**collectionRate**
- `percentage` - Collection rate as percentage (88% = 88.0)
- `totalCollected` - Total amount collected in Naira
- `totalDue` - Total amount due in Naira
- `formattedCollected` - Formatted collected amount (e.g., "₦62.2M")
- `formattedDue` - Formatted due amount (e.g., "₦70.6M")

**onTimePayments**
- `percentage` - On-time payment rate as percentage
- `onTimeCount` - Number of invoices paid on or before due date
- `totalCount` - Total number of paid invoices
- `lateCount` - Number of invoices paid after due date

**period**
- `startDate` - Start of date range (null if not provided)
- `endDate` - End of date range (null if not provided)

---

### Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "PSP not found"
}
```

**500 Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "Failed to fetch collection statistics"
}
```

---

### JavaScript Example

```javascript
// Fetch statistics
const getCollectionStats = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(
    `/api/psp/dashboard/collection-stats?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const result = await response.json();
  return result.data;
};

// Usage
const stats = await getCollectionStats('2025-01-01', '2025-12-31');
console.log(`Collection Rate: ${stats.collectionRate.percentage}%`);
console.log(`Collected: ${stats.collectionRate.formattedCollected}`);
console.log(`On-Time Rate: ${stats.onTimePayments.percentage}%`);
console.log(`On-Time: ${stats.onTimePayments.onTimeCount} of ${stats.onTimePayments.totalCount}`);
```

---

### Performance

- **Cached:** Response time < 10ms (Redis cache, 15-minute TTL)
- **Uncached:** Response time 50-200ms (MongoDB aggregation)
