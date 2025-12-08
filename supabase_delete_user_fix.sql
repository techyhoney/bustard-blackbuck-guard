-- First, update the RLS policy to check for admin role
DROP POLICY IF EXISTS "Delete User" ON public.user_profile;

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
