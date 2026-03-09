-- Add locale preference to users table
ALTER TABLE users
ADD COLUMN locale TEXT DEFAULT 'pl' CHECK (locale IN ('en', 'pl'));

-- Add index for locale lookups
CREATE INDEX idx_users_locale ON users(locale);

-- Update existing users to use Polish locale (default for Polish business)
UPDATE users SET locale = 'pl' WHERE locale IS NULL;

-- Add comment
COMMENT ON COLUMN users.locale IS 'User preferred language: en (English) or pl (Polish)';
