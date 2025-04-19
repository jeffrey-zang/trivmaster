import { Answer } from "@/socket/types";

export interface AnswerRequiredTerm {
  term: string;
}
export interface AnswerOptionalTerm {
  term: string;
}
export interface AnswerRow {
  id: number;
  answer_text: string;
  answer_required_terms: AnswerRequiredTerm[];
  answer_optional_terms: AnswerOptionalTerm[];
}

export interface PromptRow {
  prompt: string;
}
export interface RejectRow {
  term: string;
}

export interface QuestionRow {
  id: number;
  number: number;
  question: string;
  question_prompts: PromptRow[];
  question_rejects: RejectRow[];
  answers: AnswerRow[];
}

export interface SectionRow {
  id: number;
  title: string;
  questions: QuestionRow[];
}

export interface PackRow {
  id: number;
  filename: string;
  total_questions: number;
  sections: SectionRow[];
}

export interface OutputQuestion {
  number: number;
  question: string;
  prompt: string[];
  reject: string[];
  answers: Answer[];
}
export interface OutputSection {
  title: string;
  questions: OutputQuestion[];
}
export interface OutputPack {
  filename: string;
  total_questions: number;
  sections: OutputSection[];
}
