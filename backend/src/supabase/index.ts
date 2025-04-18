import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { PackRow, SectionRow, QuestionRow, OutputPack } from "./types.ts";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Please set SUPABASE_URL and SUPABASE_KEY in your .env");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchAndReconstruct(): Promise<string> {
  const { data: packs, error } = (await supabase.from("packs").select(`
    id,
    filename,
    total_questions,
    sections (
      id,
      title,
      questions (
        id,
        number,
        question,
        question_prompts ( prompt ),
        question_rejects ( term ),
        answers (
          id,
          answer_text,
          answer_required_terms ( term ),
          answer_optional_terms ( term )
        )
      )
    )
  `)) as { data: PackRow[] | null; error: any };

  if (error) {
    console.error("Error fetching data:", error);
    process.exit(1);
  }

  const output: OutputPack[] = (packs || []).map((pack: PackRow) => ({
    id: pack.id,
    filename: pack.filename,
    total_questions: pack.total_questions,
    sections: (pack.sections || []).map((section: SectionRow) => ({
      title: section.title,
      questions: (section.questions || []).map((q: QuestionRow) => ({
        number: q.number,
        question: q.question,
        prompt: q.question_prompts.map((p) => p.prompt),
        reject: q.question_rejects.map((r) => r.term),
        answers: (q.answers || []).map((a) => ({
          text: a.answer_text,
          required: a.answer_required_terms.map((rt) => rt.term),
          optional: a.answer_optional_terms.map((ot) => ot.term),
        })),
      })),
    })),
  }));

  return JSON.stringify(output, null, 2);
}
