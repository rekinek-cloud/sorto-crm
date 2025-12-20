-- Add weeklyTemplate field to DayTemplate model
ALTER TABLE "day_templates" ADD COLUMN "weeklyTemplate" BOOLEAN NOT NULL DEFAULT false;