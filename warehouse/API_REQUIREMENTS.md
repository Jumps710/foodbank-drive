# Warehouse System API Requirements

This document outlines the API endpoints that need to be implemented in the Google Apps Script backend for the warehouse system.

## Base Configuration
- **API URL**: `https://script.google.com/macros/s/AKfycby3cljD8FT5yBB2VM4Q2pw7Za8OfT6L5m67dtdVfUjnhedNBDK384E3GNBp1XzQFK1g/exec`
- **Authentication**: LINE User ID based
- **Data Format**: JSON responses

## Required API Endpoints

### 1. Submit Request
- **Action**: `submitRequest`
- **Method**: POST
- **Parameters**:
  - `data` (JSON string): Complete form data
- **Request Data Structure**:
  ```json
  {
    "organizationName": "string",
    "contactPerson": "string", 
    "contactPhone": "string",
    "contactEmail": "string (optional)",
    "beneficiaryCount": "number",
    "foodType": "string",
    "quantityNeeded": "string (optional)",
    "pickupDate": "string (YYYY-MM-DD)",
    "pickupTime": "string (optional)",
    "usagePurpose": "string",
    "specialNotes": "string (optional)",
    "requesterUserId": "string",
    "requesterName": "string",
    "platform": "string",
    "submittedAt": "string (ISO date)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "requestId": "REQ-YYYYMMDD-XXXX"
  }
  ```

### 2. Get User Role
- **Action**: `getUserRole`
- **Method**: GET
- **Parameters**:
  - `lineUserId`: User ID from LINE authentication
- **Response**:
  ```json
  {
    "success": true,
    "role": "admin|requester"
  }
  ```

### 3. Get Requests
- **Action**: `getRequests`
- **Method**: GET
- **Parameters**:
  - `userId`: User ID from LINE authentication
  - `isAdmin`: boolean string ("true"|"false")
- **Response**:
  ```json
  {
    "success": true,
    "requests": [
      {
        "requestId": "string",
        "organizationName": "string",
        "contactPerson": "string",
        "foodType": "string",
        "pickupDate": "string",
        "pickupTime": "string",
        "status": "pending|approved|ready|completed|cancelled",
        "submittedAt": "string"
      }
    ]
  }
  ```

### 4. Get Request Details
- **Action**: `getRequestDetails`
- **Method**: GET
- **Parameters**:
  - `requestId`: Request ID
  - `userId`: User ID from LINE authentication
- **Response**:
  ```json
  {
    "success": true,
    "request": {
      "requestId": "string",
      "organizationName": "string",
      "contactPerson": "string",
      "contactPhone": "string",
      "contactEmail": "string",
      "beneficiaryCount": "number",
      "foodType": "string",
      "quantityNeeded": "string",
      "pickupDate": "string",
      "pickupTime": "string",
      "usagePurpose": "string",
      "specialNotes": "string",
      "status": "string",
      "requesterUserId": "string",
      "requesterName": "string",
      "platform": "string",
      "submittedAt": "string",
      "updatedAt": "string"
    }
  }
  ```

### 5. Update Request Status (Admin only)
- **Action**: `updateRequestStatus`
- **Method**: POST
- **Parameters**:
  - `requestId`: Request ID
  - `status`: New status value
  - `updatedBy`: Admin user ID
- **Response**:
  ```json
  {
    "success": true,
    "message": "Status updated successfully"
  }
  ```

### 6. Get Dashboard Data (Admin only)
- **Action**: `getDashboardData`
- **Method**: GET
- **Parameters**:
  - `userId`: Admin user ID
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalRequests": "number",
      "pendingRequests": "number", 
      "completedRequests": "number",
      "totalBeneficiaries": "number",
      "statusCounts": {
        "pending": "number",
        "approved": "number",
        "ready": "number", 
        "completed": "number",
        "cancelled": "number"
      },
      "categoryCounts": {
        "米・穀物": "number",
        "缶詰・レトルト": "number",
        "調味料・油": "number",
        "冷凍食品": "number",
        "野菜・果物": "number",
        "パン・菓子": "number",
        "その他": "number"
      },
      "recentRequests": [
        {
          "requestId": "string",
          "organizationName": "string",
          "foodType": "string",
          "status": "string",
          "submittedAt": "string"
        }
      ]
    }
  }
  ```

## Status Flow
1. **pending** → **approved** → **ready** → **completed**
2. **pending** or **approved** → **cancelled**

## Request ID Format
- Pattern: `REQ-YYYYMMDD-XXXX`
- Example: `REQ-20250823-0001`

## User Role Management
- Admin users should be managed through a separate configuration
- Default role: `requester`
- Admin access required for:
  - Viewing all requests
  - Updating request status
  - Accessing dashboard data

## Data Storage Requirements
- Store all form submissions in Google Sheets
- Maintain audit log for status changes
- Track user access patterns
- Support data export functionality

## Error Handling
All API endpoints should return consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Security Considerations
- Validate LINE User ID authenticity
- Implement role-based access control
- Sanitize all input data
- Log all admin actions
- Rate limiting for form submissions