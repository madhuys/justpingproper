Here is the full Markdown (`.md`) version of your **Just Ping Platform: Business Management API Documentation**:

---

````md
# Just Ping Platform: Business Management API Documentation

## Overview

This document outlines the API specifications for business profile management within the Just Ping communication platform. These APIs enable authorized users to:

- View and update business information
- Manage business documents
- Handle KYC (Know Your Customer) details including GST documentation

---

## Database Schema Analysis

### `business` table:

- Contains core business profile information
- Stores contact details, billing information, and settings as JSONB
- Includes a `kyc` JSONB field for GST and bank details

### `document` table:

- Manages business-related documents
- Supports document categorization via `document_type`
- Enables tracking of document status and metadata

---

## Authentication & Authorization

All API requests require JWT-based authentication:

```http
Authorization: Bearer <your-token>
```
````

Access to business management endpoints is controlled through role-based permissions:

- By default, only **Super Admin** can manage business profiles
- Custom roles with `manage_business_profile` permission can also access these endpoints

---

## API Endpoints

### 1. Get Business Profile

- **Endpoint:** `GET /api/v1/business`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Response:** `200 OK`

```json
{
  "id": "7b23c510-a91f-4c9a-9bbd-d526ba165831",
  "name": "Acme Corporation",
  ...
}
```

---

### 2. Update Business Profile

- **Endpoint:** `PUT /api/v1/business`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Request Body:**

```json
{
  "name": "Acme Solutions",
  ...
}
```

**Response:** `200 OK`

```json
{
  "id": "7b23c510-a91f-4c9a-9bbd-d526ba165831",
  ...
}
```

---

### 3. Update Business Profile Image

- **Endpoint:** `POST /api/v1/business/profile-image`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Request:**

- `Content-Type: multipart/form-data`
- Field: `profile_image` (file)

**Response:**

```json
{
  "profile_image": "/storage/profiles/acme-new-logo.png",
  "message": "Profile image updated successfully"
}
```

---

### 4. Get KYC Information

- **Endpoint:** `GET /api/v1/business/kyc`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Response:** `200 OK`

```json
{
  "gst_number": "27AAPFU0939F1ZV",
  ...
}
```

---

### 5. Update KYC Information

- **Endpoint:** `PUT /api/v1/business/kyc`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Request Body:**

```json
{
  "gst_number": "27AAPFU0939F1ZV",
  ...
}
```

**Response:** `200 OK`

```json
{
  "verification_status": "pending_verification",
  ...
}
```

---

### 6. Upload Business Document

- **Endpoint:** `POST /api/v1/business/documents`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Request:**

- `Content-Type: multipart/form-data`
- Fields:
  - `document` (file)
  - `document_type` (e.g. `gst_certificate`)
  - `description` (optional)

**Response:** `201 Created`

```json
{
  "id": "f5e4d3c2-b1a2-3c4d-5e6f-7a8b9c0d1e2f",
  ...
}
```

---

### 7. Get Business Documents

- **Endpoint:** `GET /api/v1/business/documents`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Query Parameters:**

- `document_type` (optional)
- `page` (default: 1)
- `limit` (default: 20)

**Response:** `200 OK`

```json
{
  "total": 5,
  "page": 1,
  ...
}
```

---

### 8. Get Specific Business Document

- **Endpoint:** `GET /api/v1/business/documents/{document_id}`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Response:** `200 OK`

```json
{
  "id": "f5e4d3c2-b1a2-3c4d-5e6f-7a8b9c0d1e2f",
  ...
}
```

---

### 9. Download Business Document

- **Endpoint:** `GET /api/v1/business/documents/{document_id}/download`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Response:** `200 OK`  
`Content-Type` based on file

---

### 10. Update Business Document

- **Endpoint:** `PUT /api/v1/business/documents/{document_id}`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Request Body:**

```json
{
  "description": "GST Certificate for FY 2025-26",
  "document_type": "gst_certificate",
  "status": "active"
}
```

**Response:** `200 OK`

```json
{
  "message": "Document updated successfully"
}
```

---

### 11. Delete Business Document

- **Endpoint:** `DELETE /api/v1/business/documents/{document_id}`
- **Authorization:** Super Admin or roles with `manage_business_profile` permission

**Response:** `200 OK`

```json
{
  "message": "Document deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication credentials are missing or invalid"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to manage business profile"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "The requested document was not found"
}
```

### 413 Payload Too Large

```json
{
  "error": "Payload Too Large",
  "message": "The uploaded file exceeds the maximum allowed size of 10MB"
}
```

### 415 Unsupported Media Type

```json
{
  "error": "Unsupported Media Type",
  "message": "File type not supported. Allowed types: pdf, jpg, png"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Implementation Notes

### Database Enhancements

Add `business_verification` table:

```sql
CREATE TABLE business_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES business_user(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, verification_type)
);
```

Enhance `document` table:

```sql
ALTER TABLE document ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE document ADD COLUMN verified_by UUID REFERENCES business_user(id) ON DELETE SET NULL;
ALTER TABLE document ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE document ADD COLUMN rejection_reason TEXT;
```

---

## Role-Based Access Considerations

- Role-based access enforced for all endpoints
- Custom roles can be assigned `manage_business_profile` or document-specific permissions
- Changes are logged in `audit_log` for compliance

---

## Document Management Best Practices

- Virus scanning
- File type validation and size limits (10MB recommended)
- Secure access control and encryption at rest
- Versioning through status management
- Retention policies for compliance

---

## Conclusion

This API documentation defines a complete and secure framework for managing business profiles, KYC, and documents in the **Just Ping Platform**. It follows RESTful practices and integrates with role-based access for scalable, compliant operations tailored for Indian businesses.

```

Let me know if you want this saved as a `.md` file or need a downloadable version.
```
