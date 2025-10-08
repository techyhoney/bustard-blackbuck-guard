# Supabase Authentication Setup

This document describes the Supabase authentication implementation in the Wildlife Survey Admin application.

## Overview

The application uses Supabase for authentication with email/password sign-in. The implementation follows best practices for security, error handling, and user experience.

## Features Implemented

✅ **Email/Password Authentication** - Secure login with Supabase Auth  
✅ **Protected Routes** - Dashboard routes are only accessible when authenticated  
✅ **Automatic Session Management** - Sessions persist across page refreshes  
✅ **Auto-redirect** - Logged-in users are redirected from login page to dashboard  
✅ **Logout Functionality** - Clean sign-out with session termination  
✅ **User Context** - Global authentication state via React Context  
✅ **Loading States** - Proper UI feedback during authentication operations  
✅ **Error Handling** - User-friendly error messages with toast notifications  

## Architecture

### File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── contexts/
│   └── AuthContext.tsx          # Authentication context provider
├── components/
│   ├── ProtectedRoute.tsx       # Route protection component
│   └── DashboardLayout.tsx      # Updated with logout functionality
├── pages/
│   └── Login.tsx                # Updated login page with Supabase auth
└── App.tsx                      # Updated with AuthProvider and protected routes
```

### Key Components

#### 1. Supabase Client (`src/lib/supabase.ts`)
- Initializes the Supabase client
- Configured with auto-refresh tokens
- Persists sessions in localStorage
- Uses environment variables for credentials

#### 2. Auth Context (`src/contexts/AuthContext.tsx`)
- Provides authentication state globally
- Handles sign-in, sign-up, and sign-out operations
- Manages user session and auth state changes
- Includes error handling with user feedback

#### 3. Protected Route (`src/components/ProtectedRoute.tsx`)
- Wraps protected pages
- Shows loading skeleton while checking auth state
- Redirects unauthenticated users to login
- Prevents unauthorized access

#### 4. Login Page (`src/pages/Login.tsx`)
- Email/password login form
- Integration with Supabase auth
- Auto-redirects authenticated users
- Proper validation and error handling

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://hpqfxtvhmutzypmubbyl.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The `.env` file is git-ignored for security. Use `.env.example` as a template.

### Current Configuration

The app is configured with the following Supabase credentials:
- **Project URL:** `https://hpqfxtvhmutzypmubbyl.supabase.co`
- **Anon Key:** (Configured in the application)

## Authentication Flow

### Sign In Flow
1. User enters email and password
2. Credentials are validated by Supabase
3. On success, session is created and stored
4. User is redirected to dashboard
5. Auth state is updated globally

### Sign Out Flow
1. User clicks logout button
2. Supabase session is terminated
3. Local session data is cleared
4. User is redirected to login page
5. Auth state is updated globally

### Protected Route Access
1. User attempts to access protected route
2. ProtectedRoute checks authentication state
3. If authenticated, content is rendered
4. If not authenticated, redirected to login
5. Loading state shown during auth check

## Supabase Dashboard Configuration

### Required Setup in Supabase

1. **Email Authentication**
   - Navigate to Authentication → Providers
   - Enable "Email" provider
   - Configure email templates (optional)

2. **User Management**
   - Users can be created via:
     - Supabase Dashboard (Authentication → Users)
     - Sign-up functionality (can be added later)
     - SQL commands

3. **Security Policies**
   - Configure Row Level Security (RLS) as needed
   - Set up policies for your database tables
   - Ensure proper access controls

## Usage

### Creating Users

Since the app currently only implements sign-in (not sign-up), users must be created in Supabase Dashboard:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" or "Invite User"
3. Enter email and password
4. User can now log in with these credentials

### Testing Authentication

1. Start the development server: `npm run dev`
2. Navigate to the login page
3. Enter credentials for a user created in Supabase
4. Verify successful login and redirect to dashboard
5. Test logout functionality
6. Verify protected route access control

## Security Best Practices Implemented

✅ **Environment Variables** - Sensitive credentials stored in env vars  
✅ **HTTPS Only** - Supabase enforces HTTPS connections  
✅ **Token Auto-refresh** - Prevents session expiration issues  
✅ **Secure Storage** - Sessions stored in localStorage with encryption  
✅ **Client-side Protection** - Routes protected at component level  
✅ **Error Sanitization** - User-friendly error messages without exposing internals  

## Future Enhancements

### Recommended Additions

1. **Sign-Up Functionality**
   - Add user registration page
   - Email verification flow
   - Password strength validation

2. **Password Recovery**
   - "Forgot Password" feature
   - Email-based password reset
   - Secure token validation

3. **Profile Management**
   - Update email
   - Change password
   - User profile page

4. **Enhanced Security**
   - Multi-factor authentication (MFA)
   - Session timeout warnings
   - Login attempt monitoring

5. **User Roles & Permissions**
   - Role-based access control (RBAC)
   - Permission-based UI rendering
   - Admin vs regular user roles

## Troubleshooting

### Common Issues

**Issue: "Invalid login credentials"**
- Verify user exists in Supabase Dashboard
- Check email and password are correct
- Ensure email provider is enabled in Supabase

**Issue: Infinite loading on protected routes**
- Check Supabase URL and key are correct
- Verify network connection to Supabase
- Check browser console for errors

**Issue: User logged out unexpectedly**
- Check token refresh is working
- Verify session storage is not being cleared
- Check Supabase session timeout settings

**Issue: Environment variables not loading**
- Ensure `.env` file exists in project root
- Restart development server after changing env vars
- Verify variable names start with `VITE_`

## API Reference

### useAuth Hook

```typescript
const {
  user,        // Current user object or null
  session,     // Current session or null
  loading,     // Boolean: auth state loading
  signIn,      // Function: (email, password) => Promise
  signUp,      // Function: (email, password) => Promise
  signOut,     // Function: () => Promise
} = useAuth();
```

### Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// Available for direct API calls if needed
await supabase.auth.getSession();
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
```

## Support

For issues related to:
- **Supabase Configuration:** Check [Supabase Docs](https://supabase.com/docs)
- **Authentication Issues:** Review Supabase Dashboard → Authentication → Logs
- **Application Errors:** Check browser console and network tab

## License

This implementation is part of the Wildlife Survey Admin application.

