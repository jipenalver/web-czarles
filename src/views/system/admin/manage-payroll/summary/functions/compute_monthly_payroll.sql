-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS compute_monthly_payroll(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION compute_monthly_payroll(
  p_month TEXT,
  p_year INTEGER
)
RETURNS TABLE (
  employee_id INTEGER,
  employee_name TEXT,
  daily_rate NUMERIC,
  days_worked NUMERIC,
  cola NUMERIC,
  overtime_hrs NUMERIC,
  basic_pay NUMERIC,
  overtime_pay NUMERIC,
  trips_pay NUMERIC,
  holidays_pay NUMERIC,
  gross_pay NUMERIC,
  cash_advance NUMERIC,
  sss NUMERIC,
  phic NUMERIC,
  pagibig NUMERIC,
  sss_loan NUMERIC,
  savings NUMERIC,
  salary_deposit NUMERIC,
  late_deduction NUMERIC,
  undertime_deduction NUMERIC,
  total_deductions NUMERIC,
  net_pay NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_month_index INTEGER;
BEGIN
  -- Convert month name to month index
  v_month_index := CASE p_month
    WHEN 'January' THEN 1
    WHEN 'February' THEN 2
    WHEN 'March' THEN 3
    WHEN 'April' THEN 4
    WHEN 'May' THEN 5
    WHEN 'June' THEN 6
    WHEN 'July' THEN 7
    WHEN 'August' THEN 8
    WHEN 'September' THEN 9
    WHEN 'October' THEN 10
    WHEN 'November' THEN 11
    WHEN 'December' THEN 12
    ELSE 1
  END;

  -- Calculate date range
  v_start_date := make_date(p_year, v_month_index, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  RETURN QUERY
  WITH 
  -- Get active employees
  active_employees AS (
    SELECT 
      e.id,
      e.firstname,
      e.lastname,
      COALESCE(e.daily_rate, 0) AS daily_rate,
      COALESCE(e.is_field_staff, false) AS is_field_staff
    FROM employees e
    WHERE e.deleted_at IS NULL
  ),
  
  -- Calculate attendance/days worked with late and undertime
  attendance_data AS (
    SELECT 
      a.employee_id,
      -- Count full days and half days
      COALESCE(SUM(
        CASE 
          -- Full day: all 4 timestamps present
          WHEN a.am_time_in IS NOT NULL AND a.am_time_out IS NOT NULL 
            AND a.pm_time_in IS NOT NULL AND a.pm_time_out IS NOT NULL THEN 1.0
          -- Half day AM: only AM timestamps present
          WHEN a.am_time_in IS NOT NULL AND a.am_time_out IS NOT NULL 
            AND (a.pm_time_in IS NULL OR a.pm_time_out IS NULL) THEN 0.5
          -- Half day PM: only PM timestamps present
          WHEN (a.am_time_in IS NULL OR a.am_time_out IS NULL) 
            AND a.pm_time_in IS NOT NULL AND a.pm_time_out IS NOT NULL THEN 0.5
          ELSE 0
        END
      ), 0) AS days_worked,
      -- Calculate late minutes (time in after scheduled start) - Only for non-field staff
      COALESCE(SUM(
        CASE 
          WHEN ae.is_field_staff THEN 0
          WHEN a.am_time_in IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (a.am_time_in::time - '08:12:00'::time)) / 60)
          ELSE 0
        END +
        CASE 
          WHEN ae.is_field_staff THEN 0
          WHEN a.pm_time_in IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (a.pm_time_in::time - '13:00:00'::time)) / 60)
          ELSE 0
        END
      ), 0) / 60.0 AS late_hours,
      -- Calculate undertime minutes (time out before scheduled end) - Only for non-field staff
      COALESCE(SUM(
        CASE 
          WHEN ae.is_field_staff THEN 0
          WHEN a.am_time_out IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM ('11:50:00'::time - a.am_time_out::time)) / 60)
          ELSE 0
        END +
        CASE 
          WHEN ae.is_field_staff THEN 0
          WHEN a.pm_time_out IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (
              CASE 
                WHEN EXTRACT(DOW FROM COALESCE(a.am_time_in::DATE, a.pm_time_in::DATE)) IN (5, 6) THEN '16:30:00'::time
                ELSE '17:00:00'::time
              END - a.pm_time_out::time
            )) / 60)
          ELSE 0
        END
      ), 0) / 60.0 AS undertime_hours
    FROM attendances a
    INNER JOIN active_employees ae ON a.employee_id = ae.id
    WHERE a.am_time_in::DATE BETWEEN v_start_date AND v_end_date
    GROUP BY a.employee_id
  ),
  
  -- Calculate overtime (from attendances table)
  overtime_data AS (
    SELECT 
      a.employee_id,
      COALESCE(SUM(
        CASE 
          WHEN a.overtime_in IS NOT NULL AND a.overtime_out IS NOT NULL THEN
            EXTRACT(EPOCH FROM (a.overtime_out::timestamp - a.overtime_in::timestamp)) / 3600.0
          ELSE 0
        END
      ), 0) AS overtime_hrs
    FROM attendances a
    WHERE a.am_time_in::DATE BETWEEN v_start_date AND v_end_date
      AND a.is_overtime_applied = true
    GROUP BY a.employee_id
  ),
  
  -- Calculate trips
  trips_data AS (
    SELECT 
      t.employee_id,
      COALESCE(SUM(COALESCE(t.per_trip, 0) * COALESCE(t.trip_no, 1)), 0) AS trips_amount
    FROM trips t
    WHERE t.trip_at BETWEEN v_start_date AND v_end_date
      AND t.employee_id IS NOT NULL
    GROUP BY t.employee_id
  ),
  
  -- Calculate holiday pay per employee (only for days with attendance)
  holiday_pay_data AS (
    SELECT 
      a.employee_id,
      COALESCE(SUM(
        ae.daily_rate * 
        CASE 
          WHEN LOWER(h.type) LIKE '%rh%' THEN 2.0
          WHEN LOWER(h.type) LIKE '%snh%' THEN 1.5
          WHEN LOWER(h.type) LIKE '%swh%' THEN 1.3
          ELSE 1.0
        END
      ), 0) AS holiday_amount
    FROM attendances a
    INNER JOIN holidays h ON a.am_time_in::DATE = h.holiday_at
    INNER JOIN active_employees ae ON a.employee_id = ae.id
    WHERE a.am_time_in::DATE BETWEEN v_start_date AND v_end_date
      AND a.am_time_in IS NOT NULL AND a.am_time_out IS NOT NULL 
      AND a.pm_time_in IS NOT NULL AND a.pm_time_out IS NOT NULL
    GROUP BY a.employee_id
  ),
  
  -- Calculate cash advances
  cash_advance_data AS (
    SELECT 
      ca.employee_id,
      COALESCE(SUM(ca.amount), 0) AS cash_advance_total
    FROM cash_advances ca
    WHERE ca.request_at::DATE BETWEEN v_start_date AND v_end_date
      AND ca.employee_id IS NOT NULL
    GROUP BY ca.employee_id
  ),
  
  -- Get employee deductions with benefit details
  employee_deductions_with_benefits AS (
    SELECT 
      ed.employee_id,
      b.benefit,
      b.is_deduction,
      COALESCE(ed.amount, 0) AS amount
    FROM employee_deductions ed
    LEFT JOIN employee_benefits b ON ed.benefit_id = b.id
  ),
  
  -- Calculate deduction totals by type
  deduction_totals AS (
    SELECT 
      edwb.employee_id,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = true AND LOWER(edwb.benefit) LIKE '%sss%' AND LOWER(edwb.benefit) NOT LIKE '%loan%'), 0) AS sss,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = true AND (LOWER(edwb.benefit) LIKE '%phic%' OR LOWER(edwb.benefit) LIKE '%philhealth%')), 0) AS phic,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = true AND LOWER(edwb.benefit) LIKE '%pag%ibig%'), 0) AS pagibig,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = true AND LOWER(edwb.benefit) LIKE '%sss%' AND LOWER(edwb.benefit) LIKE '%loan%'), 0) AS sss_loan,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = true AND LOWER(edwb.benefit) LIKE '%saving%'), 0) AS savings,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = true AND LOWER(edwb.benefit) LIKE '%salary%' AND LOWER(edwb.benefit) LIKE '%deposit%'), 0) AS salary_deposit
    FROM employee_deductions_with_benefits edwb
    GROUP BY edwb.employee_id
  ),
  
  -- Calculate non-deduction benefits (earnings/allowances) - for gross pay
  employee_benefits_total AS (
    SELECT 
      edwb.employee_id,
      COALESCE(SUM(edwb.amount), 0) AS benefits_total
    FROM employee_deductions_with_benefits edwb
    WHERE edwb.is_deduction = false OR edwb.is_deduction IS NULL
    GROUP BY edwb.employee_id
  )
  
  -- Final computation
  SELECT 
    ae.id::INTEGER AS employee_id,
    (ae.firstname || ' ' || ae.lastname) AS employee_name,
    ae.daily_rate AS daily_rate,
    ROUND(COALESCE(att.days_worked, 0), 1) AS days_worked,
    COALESCE(eb.benefits_total, 0) AS cola,
    ROUND(COALESCE(ot.overtime_hrs, 0), 2) AS overtime_hrs,
    ROUND(COALESCE(att.days_worked, 0) * ae.daily_rate, 2) AS basic_pay,
    ROUND(COALESCE(ot.overtime_hrs, 0) * ((ae.daily_rate / 8) * 1.25), 2) AS overtime_pay,
    COALESCE(tr.trips_amount, 0) AS trips_pay,
    COALESCE(hp.holiday_amount, 0) AS holidays_pay,
    ROUND(
      (COALESCE(att.days_worked, 0) * ae.daily_rate) + 
      COALESCE(eb.benefits_total, 0) +
      (COALESCE(ot.overtime_hrs, 0) * ((ae.daily_rate / 8) * 1.25)) +
      COALESCE(tr.trips_amount, 0) +
      COALESCE(hp.holiday_amount, 0), 2
    ) AS gross_pay,
    COALESCE(ca.cash_advance_total, 0) AS cash_advance,
    COALESCE(ded.sss, 0) AS sss,
    COALESCE(ded.phic, 0) AS phic,
    COALESCE(ded.pagibig, 0) AS pagibig,
    COALESCE(ded.sss_loan, 0) AS sss_loan,
    COALESCE(ded.savings, 0) AS savings,
    COALESCE(ded.salary_deposit, 0) AS salary_deposit,
    ROUND(
      CASE 
        WHEN ae.is_field_staff THEN 0
        ELSE COALESCE(att.late_hours, 0) * (ae.daily_rate / 8)
      END, 2
    ) AS late_deduction,
    ROUND(
      CASE 
        WHEN ae.is_field_staff THEN 0
        ELSE COALESCE(att.undertime_hours, 0) * (ae.daily_rate / 8)
      END, 2
    ) AS undertime_deduction,
    ROUND(
      COALESCE(ca.cash_advance_total, 0) +
      COALESCE(ded.sss, 0) +
      COALESCE(ded.phic, 0) +
      COALESCE(ded.pagibig, 0) +
      COALESCE(ded.sss_loan, 0) +
      COALESCE(ded.savings, 0) +
      COALESCE(ded.salary_deposit, 0) +
      CASE 
        WHEN ae.is_field_staff THEN 0
        ELSE COALESCE(att.late_hours, 0) * (ae.daily_rate / 8)
      END +
      CASE 
        WHEN ae.is_field_staff THEN 0
        ELSE COALESCE(att.undertime_hours, 0) * (ae.daily_rate / 8)
      END, 2
    ) AS total_deductions,
    ROUND(
      (COALESCE(att.days_worked, 0) * ae.daily_rate + 
       COALESCE(eb.benefits_total, 0) +
       COALESCE(ot.overtime_hrs, 0) * ((ae.daily_rate / 8) * 1.25) +
       COALESCE(tr.trips_amount, 0) +
       COALESCE(hp.holiday_amount, 0)) -
      (COALESCE(ca.cash_advance_total, 0) +
       COALESCE(ded.sss, 0) +
       COALESCE(ded.phic, 0) +
       COALESCE(ded.pagibig, 0) +
       COALESCE(ded.sss_loan, 0) +
       COALESCE(ded.savings, 0) +
       COALESCE(ded.salary_deposit, 0) +
       CASE 
         WHEN ae.is_field_staff THEN 0
         ELSE COALESCE(att.late_hours, 0) * (ae.daily_rate / 8)
       END +
       CASE 
         WHEN ae.is_field_staff THEN 0
         ELSE COALESCE(att.undertime_hours, 0) * (ae.daily_rate / 8)
       END), 2
    ) AS net_pay
  FROM active_employees ae
  LEFT JOIN attendance_data att ON ae.id = att.employee_id
  LEFT JOIN overtime_data ot ON ae.id = ot.employee_id
  LEFT JOIN trips_data tr ON ae.id = tr.employee_id
  LEFT JOIN holiday_pay_data hp ON ae.id = hp.employee_id
  LEFT JOIN cash_advance_data ca ON ae.id = ca.employee_id
  LEFT JOIN deduction_totals ded ON ae.id = ded.employee_id
  LEFT JOIN employee_benefits_total eb ON ae.id = eb.employee_id
  ORDER BY ae.firstname, ae.lastname;
END;
$$;

-- Usage example:
-- SELECT * FROM compute_monthly_payroll('October', 2025);