-- Migration script to update get_attendance_batch function
-- This handles the type change from INTEGER to BIGINT

-- Step 1: Drop all versions of the function (handling both INTEGER and BIGINT signatures)
DROP FUNCTION IF EXISTS get_attendance_batch(INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_attendance_batch(BIGINT[], TIMESTAMPTZ, TIMESTAMPTZ);

-- Step 2: Create the new version with BIGINT types
CREATE OR REPLACE FUNCTION get_attendance_batch(
  p_employee_ids BIGINT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  employee_id BIGINT,
  id BIGINT,
  am_time_in TEXT,
  am_time_out TEXT,
  pm_time_in TEXT,
  pm_time_out TEXT,
  overtime_in TEXT,
  overtime_out TEXT,
  is_leave_with_pay BOOLEAN,
  leave_type TEXT,
  leave_reason TEXT,
  attendance_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.employee_id,
    a.id,
    -- Extract time in HH24:MI format, handling NULL values
    CASE 
      WHEN a.am_time_in IS NOT NULL THEN TO_CHAR(a.am_time_in AT TIME ZONE 'UTC', 'HH24:MI')
      ELSE NULL
    END AS am_time_in,
    CASE 
      WHEN a.am_time_out IS NOT NULL THEN TO_CHAR(a.am_time_out AT TIME ZONE 'UTC', 'HH24:MI')
      ELSE NULL
    END AS am_time_out,
    CASE 
      WHEN a.pm_time_in IS NOT NULL THEN TO_CHAR(a.pm_time_in AT TIME ZONE 'UTC', 'HH24:MI')
      ELSE NULL
    END AS pm_time_in,
    CASE 
      WHEN a.pm_time_out IS NOT NULL THEN TO_CHAR(a.pm_time_out AT TIME ZONE 'UTC', 'HH24:MI')
      ELSE NULL
    END AS pm_time_out,
    CASE 
      WHEN a.overtime_in IS NOT NULL THEN TO_CHAR(a.overtime_in AT TIME ZONE 'UTC', 'HH24:MI')
      ELSE NULL
    END AS overtime_in,
    CASE 
      WHEN a.overtime_out IS NOT NULL THEN TO_CHAR(a.overtime_out AT TIME ZONE 'UTC', 'HH24:MI')
      ELSE NULL
    END AS overtime_out,
    a.is_leave_with_pay,
    a.leave_type,
    a.leave_reason,
    -- Extract date from am_time_in first, fallback to pm_time_in for PM half-days
    DATE(COALESCE(a.am_time_in, a.pm_time_in)) AS attendance_date
  FROM attendances a
  WHERE a.employee_id = ANY(p_employee_ids)
    AND (
      (a.am_time_in >= p_start_date AND a.am_time_in < p_end_date)
      OR (a.pm_time_in >= p_start_date AND a.pm_time_in < p_end_date)
    )
  ORDER BY a.employee_id, a.created_at DESC;
END;
$$;

-- Step 3: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_attendance_batch(BIGINT[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Step 4: Add comment for documentation
COMMENT ON FUNCTION get_attendance_batch(BIGINT[], TIMESTAMPTZ, TIMESTAMPTZ) IS 'Batch fetch attendance records for multiple employees within a date range. Returns time fields pre-formatted as HH24:MI strings. Optimized to reduce API calls.';

-- Step 5: Verify the function was created successfully
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname = 'get_attendance_batch';
