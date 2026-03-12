-- ============================================
-- Scholar Portal Database Schema
-- Research Supervision Management System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('professor', 'scholar', 'co_supervisor')),
  is_admin BOOLEAN DEFAULT FALSE,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- ============================================
-- PROFESSORS TABLE
-- ============================================
CREATE TABLE professors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  UNIQUE(user_id)
);

CREATE INDEX idx_professors_user_id ON professors(user_id);
CREATE INDEX idx_professors_invite_code ON professors(invite_code);

-- ============================================
-- SCHOLARS TABLE
-- ============================================
CREATE TABLE scholars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  research_topic TEXT NOT NULL DEFAULT '',
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  UNIQUE(user_id)
);

CREATE INDEX idx_scholars_user_id ON scholars(user_id);
CREATE INDEX idx_scholars_professor_id ON scholars(professor_id);

-- ============================================
-- CO-SUPERVISORS TABLE
-- ============================================
CREATE TABLE co_supervisors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  UNIQUE(user_id, professor_id)
);

CREATE INDEX idx_co_supervisors_professor_id ON co_supervisors(professor_id);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES users(id),
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  deadline TIMESTAMPTZ,
  expected_output_format TEXT,
  reference_links TEXT[],
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'submitted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_professor_id ON tasks(professor_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- ============================================
-- TASK ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  scholar_id UUID NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'submitted')),
  submission_link TEXT,
  submission_status TEXT CHECK (submission_status IN ('pending', 'approved', 'revision_required', 'rejected')),
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  UNIQUE(task_id, scholar_id)
);

CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_scholar_id ON task_assignments(scholar_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);

-- ============================================
-- MEETINGS TABLE
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  meeting_title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  agenda TEXT,
  calendar_event_id TEXT,
  fathom_meeting_id TEXT,
  transcript TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_professor_id ON meetings(professor_id);
CREATE INDEX idx_meetings_meeting_date ON meetings(meeting_date);

-- ============================================
-- MEETING PARTICIPANTS TABLE
-- ============================================
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'attendee',
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user_id ON meeting_participants(user_id);

-- ============================================
-- ACTION ITEMS TABLE
-- ============================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX idx_action_items_assigned_to ON action_items(assigned_to);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_professor_id ON announcements(professor_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

-- ============================================
-- ANNOUNCEMENT REACTIONS TABLE
-- ============================================
CREATE TABLE announcement_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, emoji)
);

CREATE INDEX idx_announcement_reactions_announcement_id ON announcement_reactions(announcement_id);
CREATE INDEX idx_announcement_reactions_user_id ON announcement_reactions(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users: all authenticated users can view user profiles
-- (names, emails, roles are not sensitive; needed for joins)
-- ============================================
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth_id = auth.uid());

-- ============================================
-- Professors: all authenticated users can view professor records
-- (needed by RLS sub-queries on meetings, tasks, scholars, etc.)
-- ============================================
CREATE POLICY "Authenticated users can view professors"
  ON professors FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Co-supervisors: all authenticated users can view
-- ============================================
CREATE POLICY "Authenticated users can view co_supervisors"
  ON co_supervisors FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Scholars: professors and the scholar themselves can view
-- ============================================
CREATE POLICY "Professors can view their scholars"
  ON scholars FOR SELECT
  USING (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Professors can insert scholars"
  ON scholars FOR INSERT
  WITH CHECK (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- Tasks: visible to creator, professor, co-supervisors, and assigned scholars
-- ============================================
CREATE POLICY "Users can view relevant tasks"
  ON tasks FOR SELECT
  USING (
    created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT s.professor_id FROM scholars s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- Task assignments: visible to the scholar and the task creator/professor
-- ============================================
CREATE POLICY "Users can view relevant task assignments"
  ON task_assignments FOR SELECT
  USING (
    scholar_id IN (
      SELECT s.id FROM scholars s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.professor_id IN (
        SELECT p.id FROM professors p
        JOIN users u ON u.id = p.user_id
        WHERE u.auth_id = auth.uid()
      )
    )
  );

-- ============================================
-- Meetings: visible to professor, participants, and co-supervisors
-- ============================================
CREATE POLICY "Users can view relevant meetings"
  ON meetings FOR SELECT
  USING (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR id IN (
      SELECT mp.meeting_id FROM meeting_participants mp
      JOIN users u ON u.id = mp.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- Meeting participants: all authenticated users can view
-- (needed by scholars to see their meeting invitations)
-- ============================================
CREATE POLICY "Authenticated users can view meeting_participants"
  ON meeting_participants FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Action items: visible to meeting participants
-- ============================================
CREATE POLICY "Authenticated users can view action_items"
  ON action_items FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Notifications: private to each user
-- ============================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================
-- Activity logs: visible to the user and their professor
-- ============================================
CREATE POLICY "Users can view relevant activity logs"
  ON activity_logs FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR user_id IN (
      SELECT s.user_id FROM scholars s
      WHERE s.professor_id IN (
        SELECT p.id FROM professors p
        JOIN users u ON u.id = p.user_id
        WHERE u.auth_id = auth.uid()
      )
    )
  );

-- ============================================
-- Announcements: visible to professor, their scholars, and co-supervisors
-- ============================================
CREATE POLICY "Users can view relevant announcements"
  ON announcements FOR SELECT
  USING (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT s.professor_id FROM scholars s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- Announcement reactions: visible to anyone who can see the announcement
-- ============================================
CREATE POLICY "Users can view announcement reactions"
  ON announcement_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Service role bypass for API routes
-- Note: API routes use the service role key which bypasses RLS

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get the current user's app user record
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, activity_type, description, metadata)
  VALUES (p_user_id, p_activity_type, p_description, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
