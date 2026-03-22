export type UserRole = "professor" | "scholar" | "co_supervisor";

export type TaskStatus = "not_started" | "in_progress" | "completed" | "submitted";
export type SubmissionStatus = "approved" | "revision_required" | "rejected" | "pending";
export type ActionItemStatus = "pending" | "completed";
export type ScholarStatus = "active" | "inactive" | "graduated";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_admin?: boolean;
  auto_meeting_sync?: boolean;
  ai_insights?: boolean;
  auto_task_gen?: boolean;
  email_notifs?: boolean;
  created_at: string;
}

export interface Professor {
  id: string;
  user_id: string;
  department: string;
  institution: string;
  user?: User;
}

export interface Scholar {
  id: string;
  user_id: string;
  professor_id: string;
  research_topic: string;
  joining_date: string;
  status: ScholarStatus;
  user?: User;
  professor?: Professor;
}

export interface CoSupervisor {
  id: string;
  user_id: string;
  professor_id: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  created_by: string;
  deadline: string;
  expected_output_format?: string;
  reference_links?: string[];
  status: TaskStatus;
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  scholar_id: string;
  status: TaskStatus;
  submission_link?: string;
  submission_status?: SubmissionStatus;
  notes?: string;
  submitted_at?: string;
  reviewed_at?: string;
  review_notes?: string;
  task?: Task;
  scholar?: Scholar;
}

export interface Meeting {
  id: string;
  professor_id: string;
  meeting_title: string;
  meeting_date: string;
  duration_minutes?: number;
  status?: string;
  meeting_link?: string;
  agenda?: string;
  calendar_event_id?: string;
  fathom_meeting_id?: string;
  transcript?: string;
  summary?: string;
  created_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  role: string;
  user?: User;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  assigned_to: string;
  description: string;
  deadline?: string;
  status: ActionItemStatus;
  assigned_user?: User;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}
