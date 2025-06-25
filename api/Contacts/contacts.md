# Contact Management API Enhancements

Based on the analysis of the current implementation and the database schema, here's a plan to enhance the Contact Management API to fully utilize all the capabilities defined in the schema.

## 1. Contact Group Field Management

The `contact_group_field` table allows for custom fields within contact groups, but the current API doesn't have endpoints to manage these fields.

### New Endpoints

#### 1.1. Create Contact Group Field

```
POST /contact-groups/{groupId}/fields
```

**Request:**

```json
{
  "name": "Company",
  "field_type": "text",
  "is_required": true,
  "default_value": "",
  "validation_rules": {
    "min_length": 2,
    "max_length": 100
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_group_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Company",
    "field_type": "text",
    "is_required": true,
    "default_value": "",
    "validation_rules": {
      "min_length": 2,
      "max_length": 100
    },
    "created_at": "2025-04-25T10:30:00Z",
    "updated_at": "2025-04-25T10:30:00Z"
  }
}
```

#### 1.2. Get Contact Group Fields

```
GET /contact-groups/{groupId}/fields
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "contact_group_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Company",
      "field_type": "text",
      "is_required": true,
      "default_value": "",
      "validation_rules": {
        "min_length": 2,
        "max_length": 100
      },
      "created_at": "2025-04-25T10:30:00Z",
      "updated_at": "2025-04-25T10:30:00Z"
    }
  ]
}
```

#### 1.3. Update Contact Group Field

```
PUT /contact-groups/{groupId}/fields/{fieldId}
```

**Request:**

```json
{
  "name": "Company Name",
  "is_required": false,
  "validation_rules": {
    "min_length": 1,
    "max_length": 200
  }
}
```

#### 1.4. Delete Contact Group Field

```
DELETE /contact-groups/{groupId}/fields/{fieldId}
```

## 2. Enhanced Contact Group Association

The `contact_group_association` table includes a `field_values` JSONB field to store custom field values, but the current implementation doesn't utilize this.

### Updates to Existing Endpoints

#### 2.1. Add Contact to Group (Enhanced)

```
POST /contacts/{contactId}/groups/{groupId}
```

**Request:**

```json
{
  "field_values": {
    "Company": "Acme Corporation",
    "Industry": "Technology",
    "Size": "Enterprise"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Contact added to group successfully",
  "data": {
    "contact_id": "a23e4567-e89b-12d3-a456-426614174000",
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "field_values": {
      "Company": "Acme Corporation",
      "Industry": "Technology",
      "Size": "Enterprise"
    }
  }
}
```

#### 2.2. Update Contact Field Values in Group

```
PUT /contacts/{contactId}/groups/{groupId}/fields
```

**Request:**

```json
{
  "field_values": {
    "Company": "Acme Inc.",
    "Size": "Medium"
  }
}
```

## 3. Channel Identifiers Management

The `end_user` table includes a `channel_identifiers` JSONB field to store identifiers across different channels.

### Updates to Existing Endpoints

#### 3.1. Create/Update Contact (Enhanced)

```
POST /contacts
PUT /contacts/{contactId}
```

**Request:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+919876543210",
  "email": "john.doe@example.com",
  "channel_identifiers": {
    "whatsapp": "+919876543210",
    "telegram": "@johndoe",
    "instagram": "johndoe_official"
  }
}
```

### New Endpoints

#### 3.2. Update Channel Identifiers

```
PUT /contacts/{contactId}/channel-identifiers
```

**Request:**

```json
{
  "channel_identifiers": {
    "whatsapp": "+919876543210",
    "telegram": "@johndoe_updated",
    "facebook": "john.doe.fb"
  }
}
```

## 4. Contact Preferences Management

The `end_user` table includes a `preferences` JSONB field for storing contact preferences.

### Updates to Existing Endpoints

#### 4.1. Create/Update Contact (Enhanced)

```
POST /contacts
PUT /contacts/{contactId}
```

**Request:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+919876543210",
  "email": "john.doe@example.com",
  "preferences": {
    "opt_in": true,
    "preferred_channel": "whatsapp",
    "communication_frequency": "weekly",
    "time_zone": "Asia/Kolkata",
    "do_not_disturb": {
      "active": true,
      "start_time": "22:00",
      "end_time": "08:00"
    }
  }
}
```

### New Endpoints

#### 4.2. Update Contact Preferences

```
PUT /contacts/{contactId}/preferences
```

**Request:**

```json
{
  "preferences": {
    "opt_in": false,
    "preferred_channel": "email",
    "communication_frequency": "monthly"
  }
}
```

## 5. Enhanced Validation

Implement validation of contact data against group field definitions, leveraging the `validation_rules` JSONB field.

### Implementation Steps

1. When adding a contact to a group, validate the provided field values against the field definitions
2. When uploading contacts in bulk, validate each contact's data against applicable field definitions
3. Return specific validation errors when field values don't meet the defined rules

## 6. Schema Updates for New Endpoints

Update the following files to implement these new features:

### 6.1. schema.js

Add validation schemas for:

- Contact group fields (create/update)
- Field values for group associations
- Channel identifiers
- Contact preferences

### 6.2. route.js

Add routes for the new endpoints:

- Contact group field management
- Contact field values in groups
- Channel identifiers
- Contact preferences

### 6.3. controller.js

Add controller methods to handle the new endpoints and enhanced functionality.

### 6.4. service.js

Implement business logic for the new features, including:

- Field validation based on rules
- Management of channel identifiers
- Handling of contact preferences

### 6.5. repository.js

Add database operations for:

- CRUD operations on contact group fields
- Updating field values in associations
- Managing channel identifiers and preferences

## 7. Enhanced Error Handling

Improve error handling, especially for field validation errors:

```json
{
  "success": false,
  "error": {
    "code": "FIELD_VALIDATION_ERROR",
    "message": "One or more fields failed validation",
    "details": [
      {
        "field": "Company",
        "value": "A",
        "rule": "min_length",
        "message": "Company name must be at least 2 characters"
      }
    ]
  }
}
```

## 8. Implementation Timeline

1. Contact Group Field Management (2 days)
2. Enhanced Contact Group Association (1 day)
3. Channel Identifiers Management (1 day)
4. Contact Preferences Management (1 day)
5. Enhanced Validation (2 days)
6. Testing and Documentation (2 days)

Total: 9 days

## 9. Documentation Updates

Update the API documentation to include:

- New endpoints
- Enhanced request/response formats
- Field validation rules
- Examples for all new features
