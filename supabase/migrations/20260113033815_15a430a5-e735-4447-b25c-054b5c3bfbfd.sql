-- Add roll number to students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS roll_no integer;

-- Basic validation (immutable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_roll_no_positive'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_roll_no_positive
      CHECK (roll_no IS NULL OR roll_no > 0);
  END IF;
END$$;

-- Helpful index for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_students_branch_roll_no
  ON public.students (branch, roll_no);
