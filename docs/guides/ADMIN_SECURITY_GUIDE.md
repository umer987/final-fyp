# Voice2Law Admin Security Guide

## Secure Admin Access

The Voice2Law admin panel is protected with enterprise-level security features to ensure only authorized administrators can access sensitive content management functions.

### Access Details

**Admin Route:** `/adminvoice2law001`  
**Login Page:** `/admin-login`

### Demo credentials

Do not store admin passwords in this repository or in frontend code.

Create or reset the demo admin account with the backend seed script:

```powershell
cd backend
npm run seed:admin
```

Override defaults via environment variables when seeding (recommended for production):

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

The seed script prints the email it created; set `ADMIN_PASSWORD` in your local `backend/.env` only — never commit that file.
