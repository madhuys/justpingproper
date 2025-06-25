# Add Team Members API Documentation

## Overview

The Add Team Members API allows you to add existing users to a team and/or create new business users and add them to a team in a single operation.

## Endpoint

**POST** `/api/v1/teams/:teamId/members`

## Authentication

Authentication using a JWT token is required:

```
Authorization: Bearer <your_jwt_token>
```

## Request Body

```json
{
  "members": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440012",
      "role": "agent"
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440013",
      "role": "supervisor",
      "create_user": {
        "email": "newuser@example.com",
        "first_name": "Jane",
        "last_name": "Doe",
        "status": "active"
      },
      "send_invitation": true,
      "invited_by": "550e8400-e29b-41d4-a716-446655440001"
    }
  ]
}
```

### Request Parameters

| Parameter                        | Type    | Required             | Description                                                                   |
| -------------------------------- | ------- | -------------------- | ----------------------------------------------------------------------------- |
| members                          | Array   | Yes                  | List of members to add to the team                                            |
| members[].user_id                | UUID    | Yes                  | ID of the user to add (can be a new ID for user creation)                     |
| members[].role                   | String  | Yes                  | Role to assign to the user in the team (member, supervisor, team_lead, agent) |
| members[].create_user            | Object  | No                   | If provided, creates a new business user with these details                   |
| members[].create_user.email      | String  | Yes (if create_user) | Email address of the new user                                                 |
| members[].create_user.first_name | String  | Yes (if create_user) | First name of the new user                                                    |
| members[].create_user.last_name  | String  | Yes (if create_user) | Last name of the new user                                                     |
| members[].create_user.status     | String  | No                   | Status of the new user (active or inactive, default: active)                  |
| members[].send_invitation        | Boolean | No                   | Whether to send invitation email for new users (default: false)               |
| members[].invited_by             | UUID    | No                   | ID of the user who invited the member (used in invitation records)            |

## Response

### Success Response

```json
{
  "status": "success",
  "data": {
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "results": {
      "added": [
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440012",
          "invitation_sent": false
        },
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440013",
          "invitation_sent": true,
          "invitation_id": "550e8400-e29b-41d4-a716-446655440020"
        }
      ],
      "failed": []
    }
  }
}
```

### Error Response

```json
{
  "status": "success",
  "data": {
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "results": {
      "added": [
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440012",
          "invitation_sent": false
        }
      ],
      "failed": [
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440013",
          "reason": "User is already a member of this team"
        }
      ]
    }
  }
}
```

## Error Codes

Common error codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (team not found)
- `500` - Internal Server Error

## Usage Examples

### Adding Existing Users to a Team

```json
{
  "members": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440012",
      "role": "agent"
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440013",
      "role": "supervisor"
    }
  ]
}
```

### Creating New Users and Adding to a Team

```json
{
  "members": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440014",
      "role": "agent",
      "create_user": {
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "send_invitation": true,
      "invited_by": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440015",
      "role": "member",
      "create_user": {
        "email": "jane.smith@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "send_invitation": true
    }
  ]
}
```

## Notes

1. If a user already exists in the system (by user_id), but `create_user` is provided, the existing user data will be used, and the `create_user` object will be ignored.

2. If `send_invitation` is set to `true` for a new user (`create_user` is provided), an invitation email will be sent to the user to set up their password.

3. If a member already exists in the team, that specific member will be marked as failed, but the operation will continue for other members.

4. You can combine adding existing users and creating new users in a single request.

5. When creating new users, they will be marked with `is_reminder` flag set to `true`, indicating they need to set up their password.
