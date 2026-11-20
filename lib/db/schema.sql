-- DormDine PostgreSQL Schema
-- Milestone 3: Database transition & atomic capacity control

CREATE TABLE IF NOT EXISTS time_slots (
  id VARCHAR(32) PRIMARY KEY,
  meal VARCHAR(16) NOT NULL,
  start_time VARCHAR(8) NOT NULL,
  end_time VARCHAR(8) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  booked INTEGER NOT NULL DEFAULT 0 CHECK (booked >= 0 AND booked <= capacity),
  disabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(32) PRIMARY KEY,
  student_name VARCHAR(128) NOT NULL,
  student_id VARCHAR(32) NOT NULL,
  slot_id VARCHAR(32) NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  meal VARCHAR(16) NOT NULL,
  start_time VARCHAR(8) NOT NULL,
  end_time VARCHAR(8) NOT NULL,
  date VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked-in', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate active reservations for the same student on the same date and meal
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_student_meal_date
ON reservations (student_id, meal, date)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reservations_slot_id ON reservations (slot_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_time_slots_meal ON time_slots (meal);
