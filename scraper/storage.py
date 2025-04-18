#!/usr/bin/env python3
import os
import sys
import json
import glob
from supabase import create_client, Client
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# -----------------------------------------------------------------------------
# CONFIGURATION: Supabase URL & Key (service_role, to bypass RLS)
# -----------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Please set SUPABASE_URL and SUPABASE_KEY in your environment.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -----------------------------------------------------------------------------
# INSERT HELPERS
# -----------------------------------------------------------------------------


def insert_and_get_id(table: str, row: Dict[str, Any]) -> int:
    """
    Insert row into `table` and return the new id.
    Supabase-py will raise an exception on failure, so we catch and re‑raise with context.
    """
    try:
        resp = supabase.table(table).insert(row).execute()
    except Exception as e:
        raise RuntimeError(f"Error inserting into {table}: {e}")

    data = getattr(resp, "data", None)
    if isinstance(data, list) and data:
        return data[0]["id"]
    elif isinstance(data, dict) and "id" in data:
        return data["id"]
    else:
        raise RuntimeError(f"Unexpected insert response for {table}: {data!r}")

# -----------------------------------------------------------------------------
# MAIN LOGIC
# -----------------------------------------------------------------------------


def load_quiz(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        quiz = json.load(f)

    pack_id = insert_and_get_id("packs", {
        "filename":        quiz["filename"],
        "total_questions": quiz["total_questions"],
    })
    print(f"Inserted pack {quiz['filename']} → id={pack_id}")

    for sec in quiz.get("sections", []):
        section_id = insert_and_get_id("sections", {
            "pack_id": pack_id,
            "title":   sec["title"]
        })

        for q in sec.get("questions", []):
            question_id = insert_and_get_id("questions", {
                "section_id": section_id,
                "number":     int(q["number"]),
                "question":   q["question"],
            })

            for prompt in q.get("prompt", []):
                supabase.table("question_prompts").insert({
                    "question_id": question_id,
                    "prompt":      prompt
                }).execute()

            for rej in q.get("reject", []):
                supabase.table("question_rejects").insert({
                    "question_id": question_id,
                    "term":        rej
                }).execute()

            for ans in q.get("answers", []):
                answer_id = insert_and_get_id("answers", {
                    "question_id": question_id,
                    "answer_text": ans["text"]
                })

                for term in ans.get("required", []):
                    supabase.table("answer_required_terms").insert({
                        "answer_id": answer_id,
                        "term":      term
                    }).execute()

                for term in ans.get("optional", []):
                    supabase.table("answer_optional_terms").insert({
                        "answer_id": answer_id,
                        "term":      term
                    }).execute()

    print(f"Finished loading {file_path}.\n")


# -----------------------------------------------------------------------------
# AUTOMATICALLY PROCESS ALL JSON FILES IN ./results
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    results_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "results"
    )
    if not os.path.isdir(results_dir):
        print(f"Error: Results directory not found at {results_dir}")
        sys.exit(1)

    json_files = glob.glob(os.path.join(results_dir, "*.json"))
    if not json_files:
        print(f"No JSON files found in {results_dir}")
        sys.exit(0)

    print(f"Found {len(json_files)} JSON files to process")
    for path in json_files:
        try:
            print(f"Loading {os.path.basename(path)}…")
            load_quiz(path)
        except Exception as e:
            print(f"Failed to load {path}: {e}")
            sys.exit(1)

    print(
        f"Successfully loaded {len(json_files)} quiz files from {results_dir}")
