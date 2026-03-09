-- Row Level Security Policies
-- BM SP. Z O.O. E-commerce Platform

-- =====================================================
-- HELPER FUNCTION FOR ADMIN CHECK
-- =====================================================

-- Create a function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

-- Users can update their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (is_admin());

-- Users can insert their own profile during signup
CREATE POLICY "Users can create own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================

-- Anyone can view categories (public catalog)
CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
TO public
USING (true);

-- Only admins can insert categories
CREATE POLICY "Only admins can insert categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update categories
CREATE POLICY "Only admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (is_admin());

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Anyone can view products (public catalog)
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
TO public
USING (true);

-- Only admins can insert products
CREATE POLICY "Only admins can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update products
CREATE POLICY "Only admins can update products"
ON products FOR UPDATE
TO authenticated
USING (is_admin());

-- Only admins can delete products
CREATE POLICY "Only admins can delete products"
ON products FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (is_admin());

-- Authenticated users can create their own orders
CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending orders
CREATE POLICY "Users can update own pending orders"
ON orders FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- Admins can update any order
CREATE POLICY "Admins can update any order"
ON orders FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- ORDER_ITEMS TABLE POLICIES
-- =====================================================

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
TO authenticated
USING (is_admin());

-- Users can insert items to their own orders
CREATE POLICY "Users can insert own order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
    AND orders.status = 'pending'
  )
);

-- Users can update their own pending order items
CREATE POLICY "Users can update own pending order items"
ON order_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
    AND orders.status = 'pending'
  )
);

-- Users can delete their own pending order items
CREATE POLICY "Users can delete own pending order items"
ON order_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
    AND orders.status = 'pending'
  )
);

-- Admins can do anything with order items
CREATE POLICY "Admins can manage all order items"
ON order_items FOR ALL
TO authenticated
USING (is_admin());
