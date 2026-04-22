// Define the end time of the morning shift as the same as the auto checkout time.
// If a manual checkout is performed at a time <= MORNING_SHIFT and >= MORNING_CHECKOUT_START,
// then any new orders and payments created afterward will be counted as part of the evening shift.
export const MORNING_SHIFT = '14:00'

// Shift checkout time windows (HH:mm format)
export const MORNING_CHECKOUT_START = '13:00'
export const MORNING_CHECKOUT_END = '14:00'
export const EVENING_CHECKOUT_START = '19:00'
export const EVENING_CHECKOUT_END = '20:30'
