export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'student' | 'instructor';
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  content: ContentBlock[];
  order: number;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface QuestionOption {
  text: string;
}

export interface Question {
  id: number;
  chapter: number;
  text: string;
  options: QuestionOption[];
  correct: number;
  created_at: string;
}

export interface Answer {
  id: number;
  question: number;
  question_text?: string;
  user: number;
  username?: string;
  selected_option: number;
  is_correct: boolean;
  created_at: string;
}

export interface ContentBlock {
  type: string;
  children: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean }>;
  [key: string]: unknown;
}