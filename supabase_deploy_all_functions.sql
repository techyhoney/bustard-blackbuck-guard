-- ============================================
-- COMPLETE USER MANAGEMENT FUNCTIONS
-- Deploy this file to Supabase SQL Editor
-- ============================================

-- 1. UPDATE USER WITH PROFILE FUNCTION
-- ============================================
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_with_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

COMMENT ON FUNCTION update_user_with_profile IS 'Allows admin users to update user profile and email. Requires admin role.';


-- 2. CHANGE USER PASSWORD FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION change_user_password(
  p_user_id UUID,
  p_new_password TEXT
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
    RAISE EXCEPTION 'not_admin: User not allowed to change passwords';
  END IF;

  -- Validate password length (minimum 6 characters)
  IF LENGTH(p_new_password) < 6 THEN
    RAISE EXCEPTION 'invalid_password: Password must be at least 6 characters long';
  END IF;

  -- Update password in auth.users using crypt extension
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if user was found and updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: User with specified ID not found';
  END IF;

  -- Return success
  v_result := json_build_object(
    'success', true,
    'message', 'Password changed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION change_user_password(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION change_user_password(UUID, TEXT) IS 'Allows admin users to change the password of any user. Requires admin role.';


-- ============================================
-- VERIFICATION QUERIES
-- Run these after deploying to verify functions exist
-- ============================================

-- Verify functions were created
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_user_with_profile', 'change_user_password')
ORDER BY routine_name;
