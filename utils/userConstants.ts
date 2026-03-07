// User role and status constants
// Centralized definitions to avoid hardcoding role strings across components

export const USER_ROLES = {
    ADMIN: 'admin',
    B2C_CUSTOMER: 'b2c_customer',
    B2B_CUSTOMER: 'b2b_customer',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const ROLE_LABELS: Record<UserRole, string> = {
    'admin': 'Administrator',
    'b2c_customer': 'B2C Customer',
    'b2b_customer': 'B2B Customer',
}

export const isB2BUser = (role: string | null | undefined): boolean => {
    return role === USER_ROLES.B2B_CUSTOMER
}

export const isAdminUser = (role: string | null | undefined): boolean => {
    return role === USER_ROLES.ADMIN
}

export const isB2CUser = (role: string | null | undefined): boolean => {
    return role === USER_ROLES.B2C_CUSTOMER
}
