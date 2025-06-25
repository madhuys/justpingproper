# Role Management API

## Overview

The Role Management API allows Admins with appropriate permissions to create, read, update, delete roles, and assign roles to business users.

## Authentication

All API requests require authentication using JWT (JSON Web Token). Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### 1. Create a New Role

- **Endpoint:** `POST /api/v1/roles`
- **Authorization:** Requires `roles.create` permission
- **Request Body:**

```json
{
  "name": "Marketing Manager",
  "description": "Role with marketing and template capabilities",
  "permissions": {
    "roles": {
      "read": true,
      "create": false,
      "delete": false,
      "update": false
    },
    "users": {
      "read": true,
      "create": false,
      "delete": false,
      "update": false
    },
    "business": {
      "read": true,
      "create": false,
      "delete": false,
      "update": false
    },
    "contacts": {
      "read": true,
      "create": true,
      "delete": true,
      "update": true
    },
    "templates": {
      "read": true,
      "create": true,
      "delete": true,
      "update": true
    }
  }
}
```

- **Response: `201 Created`**

### 2. Get All Roles

- **Endpoint:** `GET /api/v1/roles`
- **Authorization:** Requires `roles.read` permission
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
- **Response: `200 OK`**

### 3. Get a Specific Role

- **Endpoint:** `GET /api/v1/roles/{roleId}`
- **Authorization:** Requires `roles.read` permission
- **Path Parameters:**
  - `roleId`: UUID of the role
- **Response: `200 OK`**

### 4. Update a Role

- **Endpoint:** `PUT /api/v1/roles/{roleId}`
- **Authorization:** Requires `roles.update` permission
- **Request Body:**

```json
{
  "name": "Updated Role Name",
  "description": "Updated role description",
  "permissions": {
    "roles": {
      "read": true,
      "create": false,
      "delete": false,
      "update": false
    },
    "users": { "read": true, "create": false, "delete": false, "update": false }
  }
}
```

- **Response: `200 OK`**

### 5. Delete a Role

- **Endpoint:** `DELETE /api/v1/roles/{roleId}`
- **Authorization:** Requires `roles.delete` permission
- **Response:** `204 No Content`

### 6. Assign Role to User

- **Endpoint:** `POST /api/v1/roles/users/{userId}/roles`
- **Authorization:** Requires `users.update` permission
- **Request Body:**

```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440001"
}
```

- **Response: `201 Created`**

### 7. Remove Role from User

- **Endpoint:** `DELETE /api/v1/roles/users/{userId}/roles/{roleId}`
- **Authorization:** Requires `users.update` permission
- **Response:** `204 No Content`

### 8. Get User Roles

- **Endpoint:** `GET /api/v1/roles/users/{userId}/roles`
- **Authorization:** Requires `users.read` permission
- **Response: `200 OK`**

### 9. Update User Roles

- **Endpoint:** `PUT /api/v1/roles/users/{userId}/roles`
- **Authorization:** Requires `users.update` permission
- **Request Body:**

```json
{
  "roleIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

- **Response: `200 OK`**

## Default Roles

The system includes four default roles:

### 1. Admin

Administrator with full access to all platform features.

### 2. Manager

Management access with some restrictions.

### 3. Editor

Content creation and management access.

### 4. Viewer

View-only access with limited capabilities.

## Error Responses

- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication credentials are missing or invalid
- `403 Forbidden` - You do not have permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Role already exists
- `500 Internal Server Error` - Unexpected error occurred

## Implementation Notes

- The Admin role is auto-assigned to the first user created for a business.
- Default system roles cannot be deleted, but can be modified.
- Users assigned multiple roles inherit the union of all permissions.
- All role operations are logged in the audit_log table.
- OBAC (Object-Based Access Control) is used with `read`, `create`, `update`, `delete` permissions.
