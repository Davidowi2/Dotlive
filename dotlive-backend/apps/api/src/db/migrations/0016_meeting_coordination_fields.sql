-- Add meeting coordination fields to meetings table
ALTER TABLE meetings 
ADD COLUMN meeting_platform TEXT,
ADD COLUMN meeting_link TEXT,
ADD COLUMN coordination_notes TEXT,
ADD COLUMN agenda JSONB DEFAULT '[]'::jsonb;
