# First-Time Password Reset Guide

## When You See This Response

If you receive this response when logging in:

```json
{
  "requirePasswordChange": true,
  "message": "You must change your temporary password before continuing",
  "changePasswordToken": "2d44f4b6e5440d5b75c335b03c4b4e20b5028c26301974d3589a0e81aff4b1ae",
  "email": "igelejnr@gmail.com",
  "role": "psp"
}
```

**This means you have a temporary password and must reset it before accessing your account.**

---

## What To Do

1. **Redirect** to the **First-Time Password Reset Screen**
2. Prompt the user to enter a new password
3. Call the password reset API with the token provided

---

## Password Reset API

### Endpoint
```
POST /api/auth/reset-password
```

### Request Headers
```
Content-Type: application/json
```

**Note:** No authentication token required for this endpoint.

### Request Body
```json
{
  "token": "2d44f4b6e5440d5b75c335b03c4b4e20b5028c26301974d3589a0e81aff4b1ae",
  "newPassword": "NewSecurePassword123!"
}
```

### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | The `changePasswordToken` from login response |
| newPassword | string | Yes | New password (minimum 6 characters) |

---

## Success Response (200 OK)
```json
{
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

## Error Responses

**400 Bad Request - Invalid Token:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token",
  "error": "Bad Request"
}
```

**400 Bad Request - Token Expired:**
```json
{
  "statusCode": 400,
  "message": "Reset token has expired",
  "error": "Bad Request"
}
```

**Note:** Token expires after 1 hour.

---

## After Password Reset

Once the password is reset successfully:

1. User can login normally with their email and new password
2. They will receive a full login response with JWT access token
3. No more password change required

---

## Complete Flow Example

```javascript
// Step 1: User tries to login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'igelejnr@gmail.com',
    password: 'TemporaryPassword123'
  })
});

const loginData = await loginResponse.json();

// Step 2: Check if password change required
if (loginData.requirePasswordChange) {
  // Redirect to first-time password reset screen
  // Store the changePasswordToken
  const token = loginData.changePasswordToken;

  // Step 3: User enters new password, then call reset API
  const resetResponse = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: token,
      newPassword: 'NewSecurePassword123!'
    })
  });

  // Step 4: Password reset successful, redirect to login
  // User can now login with their new password
}
```

---

## Important Notes

- Token is valid for **1 hour** only
- Minimum password length: **6 characters**
- After reset, user must login again with their new password
- This applies to PSP users, Customers, and Staff (not Super Admin)
