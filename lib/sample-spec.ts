export const SAMPLE_OPENAPI = `openapi: 3.0.3
info:
  title: Vulnerable Demo API
  version: 1.0.0
  description: Intentionally weak API for security agent demos
servers:
  - url: https://api.demo.local/v1
paths:
  /auth/login:
    post:
      tags: [auth]
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string }
                password: { type: string, format: password }
      responses:
        "200":
          description: OK
  /users:
    get:
      tags: [users]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: List users
    post:
      tags: [users]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string }
                password: { type: string }
                role: { type: string }
      responses:
        "201":
          description: Created
  /users/{userId}:
    x-requires-object-ownership: true
    get:
      tags: [users]
      security:
        - bearerAuth: []
      summary: User profile by id
      description: >
        Returns profile data only after verifying the authenticated subject
        matches this userId (e.g. JWT sub claim equals path userId), or the caller is
        an authorized administrator per server policy.
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string }
      responses:
        "200":
          description: User profile
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string }
                  email: { type: string }
        "403":
          description: Forbidden — caller is not authorized for this userId
        "404":
          description: User not found
    put:
      tags: [users]
      security:
        - bearerAuth: []
      summary: Update user by id
      description: >
        Updates allowed only when the authenticated subject matches userId or
        the caller is appropriately privileged; all other requests are rejected.
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              additionalProperties: true
      responses:
        "200":
          description: Updated
        "403":
          description: Forbidden — caller is not authorized for this userId
  /admin/settings:
    get:
      tags: [admin]
      summary: Admin settings
      security:
        - bearerAuth: []
      description: >
        Authenticated administrators only: reject unauthenticated callers and any
        principal without admin-level scope (enforce via JWT role/claim or equivalent ABAC).
      responses:
        "200":
          description: Settings
        "401":
          description: Unauthorized — missing or invalid bearer token
        "403":
          description: Forbidden — authenticated but not an administrator
  /products/search:
    get:
      tags: [products]
      parameters:
        - name: q
          in: query
          schema: { type: string }
        - name: sort
          in: query
          schema: { type: string }
      responses:
        "200":
          description: Search results
  /internal/debug:
    get:
      tags: [internal]
      responses:
        "200":
          description: Debug info
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`;
