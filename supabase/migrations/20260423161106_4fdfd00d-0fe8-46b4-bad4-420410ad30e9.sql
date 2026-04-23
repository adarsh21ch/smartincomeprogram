
-- Rename "Age" field on landing pages to "Date of Birth" with optional minimum age restriction.
-- Adds two columns to landing_pages for the age-gate setting,
-- and a dob column to landing_page_registrations for the captured DOB string.

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS min_age_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_age integer NOT NULL DEFAULT 18;

ALTER TABLE public.landing_page_registrations
  ADD COLUMN IF NOT EXISTS dob text;
