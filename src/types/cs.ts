export interface CSStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  priority: string;
  is_completed: boolean;
  created_at: string;
  created_by: string;
  cs_responsible?: string;
  responsible_user?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CSFeedbackNote {
  id: string;
  student_id: string;
  note: string;
  created_at: string;
  created_by: string;
  creator?: {
    id: string;
    full_name: string;
  };
}

export interface NewCSStudent {
  name: string;
  email: string;
  phone: string;
  priority: string;
  cs_responsible?: string;
}

export interface NewCSFeedbackNote {
  note: string;
}

export interface CSUser {
  id: string;
  full_name: string;
  role: string;
} 