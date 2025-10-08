# Supabase Authentication Setup

This application uses Supabase for authentication with admin-only access control.

## Prerequisites

1. A Supabase project
2. The `user_profile` table configured in your database

## Environment Variables

Create a `.env` file in the root of your project with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting your Supabase credentials:

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the **Project URL** (this is your `VITE_SUPABASE_URL`)
5. Copy the **anon public** key (this is your `VITE_SUPABASE_ANON_KEY`)

## Database Setup

### User Profile Table

The application expects a `user_profile` table with the following schema:

```sql
CREATE TABLE user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  role TEXT NOT NULL,
  patrol_active BOOLEAN DEFAULT FALSE,
  name_of_official VARCHAR,
  employee_id VARCHAR,
  beat_number INT4,
  range_forest_office VARCHAR,
  division VARCHAR,
  last_update_date TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC
);
```

### Enable Row Level Security (RLS)

For security, enable RLS on the user_profile table:

```sql
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

Create policies to allow users to read their own profile:

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profile
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Setting Up Admin Users

To create an admin user:

1. Sign up a user through the Supabase Auth interface or your application
2. In your Supabase dashboard, go to the Table Editor
3. Open the `user_profile` table
4. Add a new row or update an existing row:
   - Set `id` to the user's auth.users UUID
   - Set `email` to the user's email
   - Set `role` to `'admin'`
   - Fill in other required fields

### Automatic Profile Creation (Optional)

You can set up a database trigger to automatically create a user_profile entry when a user signs up:

```sql
-- Function to create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user' -- Default role, change to 'admin' manually in the table
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Testing

1. Create an admin user as described above
2. Start your development server: `npm run dev`
3. Navigate to the login page
4. Sign in with the admin user's credentials
5. You should be redirected to the dashboard

## Security Features

- ✅ Only users with `role = 'admin'` can access the application
- ✅ Non-admin users are automatically logged out and redirected to login
- ✅ Protected routes redirect unauthenticated users to login
- ✅ Session persistence across page refreshes
- ✅ Secure sign out functionality

## Troubleshooting

### "Access Denied" error
- Ensure the user's profile has `role = 'admin'` in the database
- Check that the user_profile record exists for the authenticated user

### Authentication not working
- Verify your `.env` file has the correct Supabase URL and anon key
- Check that the Supabase project is active and accessible
- Look at browser console for any error messages

### Profile not loading
- Ensure the user_profile table exists and has the correct schema
- Check RLS policies are properly configured
- Verify the user's UUID matches between auth.users and user_profile tables

