-- First, update the RLS policies to check for admin role
DROP POLICY IF EXISTS "Delete User" ON public.user_profile;
DROP POLICY IF EXISTS "Update User" ON public.user_profile;

CREATE POLICY "Delete User" 
ON public.user_profile 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_profile 
    WHERE user_profile.id = auth.uid() 
    AND user_profile.role = 'admin'
  )
);

CREATE POLICY "Update User" 
ON public.user_profile 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_profile 
    WHERE user_profile.id = auth.uid() 
    AND user_profile.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_profile 
    WHERE user_profile.id = auth.uid() 
    AND user_profile.role = 'admin'
  )
);

-- Create an RPC function to delete user with profile (requires admin role)
CREATE OR REPLACE FUNCTION delete_user_with_profile(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
  v_result JSON;
BEGIN
  -- Get the current user's role
  SELECT role INTO v_current_user_role
  FROM public.user_profile
  WHERE id = auth.uid();

  -- Check if current user is admin
  IF v_current_user_role != 'admin' THEN
    RAISE EXCEPTION 'not_admin: User not allowed';
  END IF;

  -- Check if trying to delete yourself
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_delete_self: Cannot delete your own account';
  END IF;

  -- Delete from user_profile first (due to foreign key constraints)
  DELETE FROM public.user_profile
  WHERE id = p_user_id;

  -- Delete from auth.users (this requires SECURITY DEFINER)
  DELETE FROM auth.users
  WHERE id = p_user_id;

  -- Return success
  v_result := json_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_with_profile(UUID) TO authenticated;

-- Create an RPC function to update user with profile (requires admin role)
CREATE OR REPLACE FUNCTION update_user_with_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name_of_official TEXT,
  p_role TEXT,
  p_employee_id TEXT DEFAULT NULL,
  p_beat_number INTEGER DEFAULT NULL,
  p_range_forest_office TEXT DEFAULT NULL,
  p_division TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
  v_result JSON;
BEGIN
  -- Get the current user's role
  SELECT role INTO v_current_user_role
  FROM public.user_profile
  WHERE id = auth.uid();

  -- Check if current user is admin
  IF v_current_user_role != 'admin' THEN
    RAISE EXCEPTION 'not_admin: User not allowed';
  END IF;

  -- Update email in auth.users if provided
  IF p_email IS NOT NULL THEN
    UPDATE auth.users
    SET email = p_email,
        raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{email}',
          to_jsonb(p_email)
        )
    WHERE id = p_user_id;
  END IF;

  -- Update user profile
  UPDATE public.user_profile
  SET 
    name_of_official = p_name_of_official,
    role = p_role,
    employee_id = p_employee_id,
    beat_number = p_beat_number,
    range_forest_office = p_range_forest_office,
    division = p_division,
    latitude = p_latitude,
    longitude = p_longitude,
    last_update_date = NOW()
  WHERE id = p_user_id;

  -- Return success
  v_result := json_build_object(
    'success', true,
    'message', 'User updated successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_with_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
