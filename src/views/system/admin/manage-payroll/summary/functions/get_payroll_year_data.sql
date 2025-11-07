-- Optimized RPC to fetch ALL payroll-related data for an employee's entire year
-- This replaces 72+ individual API calls with a SINGLE call
-- Usage: SELECT * FROM get_payroll_year_data(1, '2024-01-01', '2024-12-31')

CREATE OR REPLACE FUNCTION get_payroll_year_data(
  p_employee_id BIGINT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'trips', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', t.id,
          'employee_id', t.employee_id,
          'unit_id', t.unit_id,
          'trip_location_id', t.trip_location_id,
          'trip_at', t.trip_at,
          'created_at', t.created_at,
          'employee', json_build_object(
            'id', e.id,
            'firstname', e.firstname,
            'lastname', e.lastname,
            'middlename', e.middlename
          ),
          'unit', json_build_object(
            'id', u.id,
            'name', u.name
          ),
          'trip_location', json_build_object(
            'id', tl.id,
            'location', tl.location,
            'description', tl.description
          )
        ) ORDER BY t.trip_at ASC
      ), '[]'::json)
      FROM trips t
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN trip_locations tl ON t.trip_location_id = tl.id
      WHERE t.employee_id = p_employee_id
        AND t.trip_at >= p_start_date
        AND t.trip_at < p_end_date + INTERVAL '1 day'
    ),
    
    'holidays', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', h.id,
          'holiday_at', h.holiday_at,
          'description', h.description,
          'type', h.type,
          'created_at', h.created_at,
          'attendance_fraction', COALESCE(
            CASE
              WHEN a.am_time_in IS NOT NULL AND a.pm_time_in IS NOT NULL THEN 1.0
              WHEN a.am_time_in IS NOT NULL OR a.pm_time_in IS NOT NULL THEN 0.5
              ELSE 0.0
            END,
            0.0
          )
        ) ORDER BY h.holiday_at ASC
      ), '[]'::json)
      FROM holidays h
      LEFT JOIN attendances a ON DATE(a.am_time_in) = h.holiday_at 
        AND a.employee_id = p_employee_id
      WHERE h.holiday_at >= p_start_date
        AND h.holiday_at < p_end_date + INTERVAL '1 day'
    ),
    
    'cash_advances', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ca.id,
          'employee_id', ca.employee_id,
          'amount', ca.amount,
          'request_at', ca.request_at,
          'created_at', ca.created_at,
          'description', ca.description
        ) ORDER BY ca.request_at ASC
      ), '[]'::json)
      FROM cash_advances ca
      WHERE ca.employee_id = p_employee_id
        AND ca.request_at >= p_start_date
        AND ca.request_at < p_end_date + INTERVAL '1 day'
    ),
    
    'utilizations', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ut.id,
          'employee_id', ut.employee_id,
          'unit_id', ut.unit_id,
          'trip_location_id', ut.trip_location_id,
          'utilization_at', ut.utilization_at,
          'hours', ut.hours,
          'overtime_hours', ut.overtime_hours,
          'per_hour', ut.per_hour,
          'created_at', ut.created_at,
          'employee', json_build_object(
            'id', e.id,
            'firstname', e.firstname,
            'lastname', e.lastname,
            'middlename', e.middlename
          ),
          'unit', json_build_object(
            'id', u.id,
            'name', u.name
          ),
          'trip_location', json_build_object(
            'id', tl.id,
            'location', tl.location,
            'description', tl.description
          )
        ) ORDER BY ut.utilization_at ASC
      ), '[]'::json)
      FROM utilizations ut
      LEFT JOIN employees e ON ut.employee_id = e.id
      LEFT JOIN units u ON ut.unit_id = u.id
      LEFT JOIN trip_locations tl ON ut.trip_location_id = tl.id
      WHERE ut.employee_id = p_employee_id
        AND ut.utilization_at >= p_start_date
        AND ut.utilization_at < p_end_date + INTERVAL '1 day'
    ),
    
    'allowances', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', al.id,
          'employee_id', al.employee_id,
          'trip_location_id', al.trip_location_id,
          'trip_at', al.trip_at,
          'amount', al.amount,
          'created_at', al.created_at,
          'employee', json_build_object(
            'id', e.id,
            'firstname', e.firstname,
            'lastname', e.lastname,
            'middlename', e.middlename
          ),
          'trip_location', json_build_object(
            'id', tl.id,
            'location', tl.location,
            'description', tl.description
          )
        ) ORDER BY al.trip_at ASC
      ), '[]'::json)
      FROM allowances al
      LEFT JOIN employees e ON al.employee_id = e.id
      LEFT JOIN trip_locations tl ON al.trip_location_id = tl.id
      WHERE al.employee_id = p_employee_id
        AND al.trip_at >= p_start_date
        AND al.trip_at < p_end_date + INTERVAL '1 day'
    ),
    
    'cash_adjustments', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', caj.id,
          'employee_id', caj.employee_id,
          'amount', caj.amount,
          'adjustment_at', caj.adjustment_at,
          'is_deduction', caj.is_deduction,
          'name', caj.name,
          'remarks', caj.remarks,
          'created_at', caj.created_at
        ) ORDER BY caj.adjustment_at ASC
      ), '[]'::json)
      FROM cash_adjustments caj
      WHERE caj.employee_id = p_employee_id
        AND caj.is_deduction = false
        AND caj.adjustment_at >= p_start_date
        AND caj.adjustment_at < p_end_date + INTERVAL '1 day'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_payroll_year_data(BIGINT, DATE, DATE) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_payroll_year_data IS 
'Batch fetch ALL payroll-related data (trips, holidays, cash advances, utilizations, allowances, cash adjustments) for an employee within a date range. Returns single JSON object. Replaces 72+ individual API calls with 1 call.';
