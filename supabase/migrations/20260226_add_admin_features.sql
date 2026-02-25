-- Add new columns to support enhanced admin features

-- Add tracking number and notes to orders table
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add soft delete flag to products table
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add is_active flag to users table (for account disable functionality)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON public.orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON public.products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.tracking_number IS 'Shipping tracking number from carrier';
COMMENT ON COLUMN public.orders.notes IS 'Admin notes about this order';
COMMENT ON COLUMN public.products.is_deleted IS 'Soft delete flag - products are not removed from database';
COMMENT ON COLUMN public.users.is_active IS 'Account status - inactive accounts cannot log in';
