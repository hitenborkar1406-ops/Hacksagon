// Clinical threshold constants — matches alertService.js on backend
export const THRESHOLDS = {
  HR_LOW_CRITICAL:   50,
  HR_HIGH_CRITICAL:  120,
  HR_LOW_WARNING:    55,
  HR_HIGH_WARNING:   100,
  SPO2_CRITICAL:     90,
  SPO2_WARNING_LOW:  90,
  SPO2_WARNING_HIGH: 93,
  IV_LOW:            50,
  IV_CRITICAL:       20,
};

export function hrStatus(hr) {
  if (hr === null || hr === undefined) return 'normal';
  if (hr < THRESHOLDS.HR_LOW_CRITICAL || hr > THRESHOLDS.HR_HIGH_CRITICAL) return 'critical';
  if (hr < THRESHOLDS.HR_LOW_WARNING  || hr > THRESHOLDS.HR_HIGH_WARNING)  return 'warning';
  return 'normal';
}

export function spo2Status(spo2) {
  if (spo2 === null || spo2 === undefined) return 'normal';
  if (spo2 < THRESHOLDS.SPO2_CRITICAL)     return 'critical';
  if (spo2 <= THRESHOLDS.SPO2_WARNING_HIGH) return 'warning';
  return 'normal';
}

export function ivStatus(remaining) {
  if (remaining === null || remaining === undefined) return 'normal';
  if (remaining < THRESHOLDS.IV_CRITICAL) return 'critical';
  if (remaining < THRESHOLDS.IV_LOW)      return 'warning';
  return 'normal';
}

export const STATUS_COLORS = {
  critical: { bg: 'bg-alert-red-bg',  text: 'text-alert-red-dark',   border: 'border-alert-red',  dot: 'bg-alert-red'  },
  warning:  { bg: 'bg-warn-amber-bg', text: 'text-yellow-800',        border: 'border-warn-amber', dot: 'bg-warn-amber' },
  normal:   { bg: 'bg-accent-blue-bg',text: 'text-accent-blue-dark',  border: 'border-accent-blue',dot: 'bg-accent-blue'},
};
