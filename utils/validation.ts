// --- Checkout / address field validators (boolean form) ---

// Returns true when the value is empty or only whitespace.
export function isBlank(value: string | null | undefined): boolean {
    return !value || value.trim().length === 0
}

// Standard email shape check (also used by the boolean-style validators below).
export function isValidEmailFormat(value: string | null | undefined): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim())
}

// Polish postal code: two digits, a hyphen, then three digits (e.g. 00-001).
export function isValidPolishPostalCode(value: string | null | undefined): boolean {
    return /^[0-9]{2}-[0-9]{3}$/.test((value || '').trim())
}

// Phone number: strip spaces, hyphens, parentheses and a leading +, then require
// a plausible PL/EU digit sequence (9–15 digits).
export function isValidPhoneNumber(value: string | null | undefined): boolean {
    const digits = (value || '').replace(/[\s\-().]/g, '').replace(/^\+/, '')
    return /^[0-9]{9,15}$/.test(digits)
}

export function validateEmail(email: string): string | null {
    if (!email || email.length === 0) {
        return 'Email is required'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address'
    }

    return null
}

export function validateSKU(sku: string): string | null {
    if (!sku || sku.length === 0) {
        return 'SKU is required'
    }

    if (sku.length < 3) {
        return 'SKU must be at least 3 characters'
    }

    if (sku.length > 50) {
        return 'SKU must be less than 50 characters'
    }

    // Allow alphanumeric, hyphens, underscores
    if (!/^[A-Za-z0-9-_]+$/.test(sku)) {
        return 'SKU can only contain letters, numbers, hyphens, and underscores'
    }

    return null
}

export function validatePrice(price: number | string): string | null {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price

    if (isNaN(numPrice)) {
        return 'Please enter a valid number'
    }

    if (numPrice <= 0) {
        return 'Price must be greater than 0'
    }

    if (numPrice > 999999.99) {
        return 'Price is too high'
    }

    return null
}

export function validateInventory(inventory: number | string): string | null {
    const numInventory = typeof inventory === 'string' ? parseInt(inventory) : inventory

    if (isNaN(numInventory)) {
        return 'Please enter a valid number'
    }

    if (numInventory < 0) {
        return 'Inventory cannot be negative'
    }

    if (numInventory > 999999) {
        return 'Inventory is too high'
    }

    return null
}

export function validateRequired(value: string, fieldName: string): string | null {
    if (!value || value.trim().length === 0) {
        return `${fieldName} is required`
    }
    return null
}

export function validateLength(value: string, min: number, max: number, fieldName: string): string | null {
    if (value.length < min) {
        return `${fieldName} must be at least ${min} characters`
    }
    if (value.length > max) {
        return `${fieldName} must be less than ${max} characters`
    }
    return null
}
