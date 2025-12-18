-- Drop the existing function signatures to allow changing parameters
DROP FUNCTION IF EXISTS compute_monthly_payroll(TEXT, INTEGER);
DROP FUNCTION IF EXISTS compute_monthly_payroll(TEXT, INTEGER, DATE, DATE);

CREATE OR REPLACE FUNCTION compute_monthly_payroll(
  p_month TEXT,
  p_year INTEGER,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  employee_id INTEGER,
  employee_name TEXT,
  designation_id INTEGER,
  designation_name TEXT,
  daily_rate NUMERIC,
  is_field_staff BOOLEAN,
  days_worked NUMERIC,
  sunday_days NUMERIC,
  sunday_amount NUMERIC,
  allowance NUMERIC,
  overtime_hrs NUMERIC,
  basic_pay NUMERIC,
  overtime_pay NUMERIC,
  trips_pay NUMERIC,
  utilizations_pay NUMERIC,
  holidays_pay NUMERIC,
  benefits_pay NUMERIC,
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
  -- If custom dates provided, use them; otherwise use full month
  IF p_from_date IS NOT NULL AND p_to_date IS NOT NULL THEN
    v_start_date := p_from_date;
    v_end_date := p_to_date;
  ELSE
    v_start_date := make_date(p_year, v_month_index, 1);
    v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  END IF;

  RETURN QUERY
  WITH 
  -- Get active employees
  active_employees AS (
    SELECT 
      e.id,
      e.firstname,
      e.lastname,
      COALESCE(e.daily_rate, 0) AS daily_rate,
      COALESCE(e.is_field_staff, false) AS is_field_staff,
      e.designation_id,
      COALESCE(ed.designation, 'No Designation') AS designation_name
    FROM employees e
    LEFT JOIN employee_designations ed ON e.designation_id = ed.id
    WHERE e.deleted_at IS NULL
  ),
  
  -- Note: Attendance, days worked, late, undertime, and overtime calculations
  -- are all handled client-side for consistency across PayrollPrint.vue and SummaryTable.vue
  -- This includes Regular Holiday (RH) logic where any attendance = full day
  
  -- Calculate allowances
  allowances_data AS (
    SELECT 
      a.employee_id,
      COALESCE(SUM(a.amount), 0) AS allowances_total
    FROM allowances a
    WHERE a.trip_at BETWEEN v_start_date AND v_end_date
      AND a.employee_id IS NOT NULL
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
  
  -- Calculate utilizations
  utilizations_data AS (
    SELECT 
      u.employee_id,
      COALESCE(SUM(COALESCE(u.hours, 0) * COALESCE(u.per_hour, 0) + COALESCE(u.overtime_hours, 0) * COALESCE(u.per_hour, 0)), 0) AS utilizations_total
    FROM utilizations u
    WHERE u.utilization_at BETWEEN v_start_date AND v_end_date
      AND u.employee_id IS NOT NULL
    GROUP BY u.employee_id
  ),
  
  -- Calculate holiday pay per employee
  -- For Regular Holidays (RH):
  --   - If employee worked (has attendance): 100% premium only (base 100% counted in basic_pay client-side)
  --   - If employee didn't work (no attendance): 100% base pay only
  -- For other holidays: Premium percentage based on type
  holiday_pay_data AS (
    SELECT 
      a.employee_id,
      COALESCE(SUM(
        ae.daily_rate * 
        CASE 
          -- Regular Holiday with attendance: 100% premium (worked)
          WHEN LOWER(h.type) LIKE '%rh%' AND (
            a.am_time_in IS NOT NULL OR a.am_time_out IS NOT NULL OR
            a.pm_time_in IS NOT NULL OR a.pm_time_out IS NOT NULL
          ) THEN 1.0
          -- Regular Holiday without attendance: 0% (will be added from rh_paid_data)
          WHEN LOWER(h.type) LIKE '%rh%' THEN 0.0
          WHEN LOWER(h.type) LIKE '%snh%' THEN 0.3       -- Special Non-Working Holiday: 30% premium
          WHEN LOWER(h.type) LIKE '%lh%' THEN 0.3        -- Local Holiday: 30% premium
          WHEN LOWER(h.type) LIKE '%ch%' THEN 0.0        -- Company Holiday: 0% premium
          WHEN LOWER(h.type) LIKE '%swh%' THEN 0.3       -- Special Working Holiday: 30% premium
          ELSE 0.0
        END *
        -- Apply day fraction based on attendance (full day or half day)
        CASE 
          -- For Regular Holidays with attendance, always full day
          WHEN LOWER(h.type) LIKE '%rh%' THEN 1.0
          -- For other holidays, normal calculation
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
      ), 0) AS holiday_amount
    FROM attendances a
    INNER JOIN holidays h ON COALESCE(a.am_time_in::DATE, a.pm_time_in::DATE) = h.holiday_at
    INNER JOIN active_employees ae ON a.employee_id = ae.id
    WHERE COALESCE(a.am_time_in::DATE, a.pm_time_in::DATE) >= v_start_date 
      AND COALESCE(a.am_time_in::DATE, a.pm_time_in::DATE) <= v_end_date
      AND (a.am_time_in IS NOT NULL OR a.pm_time_in IS NOT NULL)
    GROUP BY a.employee_id
  ),
  
  -- Calculate RH paid days (Regular Holidays without attendance)
  -- All employees get 100% base pay for RH even if they didn't work
  rh_paid_data AS (
    SELECT 
      ae.id AS employee_id,
      COALESCE(SUM(
        ae.daily_rate * 1.0  -- 100% base pay for RH paid days
      ), 0) AS rh_paid_amount
    FROM active_employees ae
    CROSS JOIN holidays h
    LEFT JOIN attendances a ON a.employee_id = ae.id 
      AND COALESCE(a.am_time_in::DATE, a.pm_time_in::DATE) = h.holiday_at
    WHERE LOWER(h.type) LIKE '%rh%'
      AND h.holiday_at BETWEEN v_start_date AND v_end_date
      AND a.employee_id IS NULL  -- No attendance record
    GROUP BY ae.id
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
  
  -- Calculate benefits (non-deductions) totals
  benefits_totals AS (
    SELECT 
      edwb.employee_id,
      COALESCE(SUM(edwb.amount) FILTER (WHERE edwb.is_deduction = false), 0) AS benefits_total
    FROM employee_deductions_with_benefits edwb
    GROUP BY edwb.employee_id
  )
  
  -- Final computation
  SELECT 
    ae.id::INTEGER AS employee_id,
    (ae.firstname || ' ' || ae.lastname) AS employee_name,
    ae.designation_id::INTEGER AS designation_id,
    ae.designation_name AS designation_name,
    COALESCE(ae.daily_rate, 0)::NUMERIC AS daily_rate,
    ae.is_field_staff::BOOLEAN AS is_field_staff,
    0::NUMERIC AS days_worked, -- Calculated client-side
    0::NUMERIC AS sunday_days, -- Calculated client-side
    0.00::NUMERIC AS sunday_amount, -- Calculated client-side
    COALESCE(al.allowances_total, 0)::NUMERIC AS allowance,
    0.00::NUMERIC AS overtime_hrs, -- Calculated client-side
    0.00::NUMERIC AS basic_pay, -- Calculated client-side (days_worked * daily_rate)
    0.00::NUMERIC AS overtime_pay, -- Calculated client-side
    COALESCE(tr.trips_amount, 0)::NUMERIC AS trips_pay,
    COALESCE(ut.utilizations_total, 0)::NUMERIC AS utilizations_pay,
    (COALESCE(hp.holiday_amount, 0) + COALESCE(rhp.rh_paid_amount, 0))::NUMERIC AS holidays_pay,
    COALESCE(ben.benefits_total, 0)::NUMERIC AS benefits_pay,
    ROUND(
      COALESCE(al.allowances_total, 0) +
      COALESCE(tr.trips_amount, 0) +
      COALESCE(ut.utilizations_total, 0) +
      COALESCE(ben.benefits_total, 0) +
      COALESCE(rhp.rh_paid_amount, 0), 2
    )::NUMERIC AS gross_pay, -- Note: basic_pay, holidays_pay (worked only), overtime_pay, sunday_amount all calculated client-side
    COALESCE(ca.cash_advance_total, 0)::NUMERIC AS cash_advance,
    COALESCE(ded.sss, 0)::NUMERIC AS sss,
    COALESCE(ded.phic, 0)::NUMERIC AS phic,
    COALESCE(ded.pagibig, 0)::NUMERIC AS pagibig,
    COALESCE(ded.sss_loan, 0)::NUMERIC AS sss_loan,
    COALESCE(ded.savings, 0)::NUMERIC AS savings,
    COALESCE(ded.salary_deposit, 0)::NUMERIC AS salary_deposit,
    0.00::NUMERIC AS late_deduction, -- Calculated client-side
    0.00::NUMERIC AS undertime_deduction, -- Calculated client-side
    ROUND(
      COALESCE(ca.cash_advance_total, 0) +
      COALESCE(ded.sss, 0) +
      COALESCE(ded.phic, 0) +
      COALESCE(ded.pagibig, 0) +
      COALESCE(ded.sss_loan, 0) +
      COALESCE(ded.savings, 0) +
      COALESCE(ded.salary_deposit, 0), 2
    )::NUMERIC AS total_deductions, -- Note: late and undertime deductions calculated client-side
    ROUND(
      (COALESCE(al.allowances_total, 0) +
       COALESCE(tr.trips_amount, 0) +
       COALESCE(ut.utilizations_total, 0) +
       COALESCE(ben.benefits_total, 0) +
       COALESCE(rhp.rh_paid_amount, 0)) -
      (COALESCE(ca.cash_advance_total, 0) +
       COALESCE(ded.sss, 0) +
       COALESCE(ded.phic, 0) +
       COALESCE(ded.pagibig, 0) +
       COALESCE(ded.sss_loan, 0) +
       COALESCE(ded.savings, 0) +
       COALESCE(ded.salary_deposit, 0)), 2
      -- Note: basic_pay, overtime, holidays_pay (worked only), sunday_amount, late and undertime all calculated client-side
    )::NUMERIC AS net_pay
  FROM active_employees ae
  LEFT JOIN allowances_data al ON ae.id = al.employee_id
  LEFT JOIN trips_data tr ON ae.id = tr.employee_id
  LEFT JOIN utilizations_data ut ON ae.id = ut.employee_id
  -- Note: overtime_data join removed, calculated client-side
  LEFT JOIN holiday_pay_data hp ON ae.id = hp.employee_id
  LEFT JOIN rh_paid_data rhp ON ae.id = rhp.employee_id
  LEFT JOIN cash_advance_data ca ON ae.id = ca.employee_id
  LEFT JOIN deduction_totals ded ON ae.id = ded.employee_id
  LEFT JOIN benefits_totals ben ON ae.id = ben.employee_id
  ORDER BY ae.firstname, ae.lastname;
END;
$$;

-- Usage examples:
-- Standard full month calculation:
-- SELECT * FROM compute_monthly_payroll('October', 2025);

-- Cross-month calculation (Day 26 of Sept to Day 25 of Oct):
-- SELECT * FROM compute_monthly_payroll('October', 2025, '2025-09-26', '2025-10-25');