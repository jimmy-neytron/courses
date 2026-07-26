-- Legacy access migration intentionally kept as a no-op.
-- The production schema has no course_memberships table.
-- Canonical owner/public read-only policies live in 11_public_course_viewing.sql.

begin;
commit;