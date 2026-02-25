// Database Types for BM SP. Z O. O. E-commerce Platform
// Generated from Supabase schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'admin' | 'b2c_customer' | 'b2b_customer'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered'

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    role: UserRole
                    company_name: string | null
                    nip_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    role?: UserRole
                    company_name?: string | null
                    nip_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    role?: UserRole
                    company_name?: string | null
                    nip_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    parent_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    parent_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    parent_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    sku: string
                    title: string
                    slug: string
                    brand: string | null
                    description: string | null
                    price_retail: number
                    price_wholesale: number
                    inventory_count: number
                    category_id: string
                    specifications: Json | null
                    image_urls: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    sku: string
                    title: string
                    slug: string
                    brand?: string | null
                    description?: string | null
                    price_retail: number
                    price_wholesale: number
                    inventory_count?: number
                    category_id: string
                    specifications?: Json | null
                    image_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    sku?: string
                    title?: string
                    slug?: string
                    brand?: string | null
                    description?: string | null
                    price_retail?: number
                    price_wholesale?: number
                    inventory_count?: number
                    category_id?: string
                    specifications?: Json | null
                    image_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    status: OrderStatus
                    total_amount: number
                    is_b2b_invoice_required: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    status?: OrderStatus
                    total_amount: number
                    is_b2b_invoice_required?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    status?: OrderStatus
                    total_amount?: number
                    is_b2b_invoice_required?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price_at_purchase: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price_at_purchase: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    price_at_purchase?: number
                    created_at?: string
                }
            }
        }
    }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

// Product with relations
export interface ProductWithCategory extends Product {
    category: Category
}

// Order with relations
export interface OrderWithItems extends Order {
    order_items: (OrderItem & {
        product: Product
    })[]
}
