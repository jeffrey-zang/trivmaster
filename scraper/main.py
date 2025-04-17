import os
import re
import PyPDF2
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path

# Load environment variables
load_dotenv()

# Supabase setup
# supabase_url = os.getenv("SUPABASE_URL")
# supabase_key = os.getenv("SUPABASE_KEY")
pdf_directory = os.getenv("PDF_DIRECTORY")

# if not all([supabase_url, supabase_key, pdf_directory]):
#     raise ValueError("Missing required environment variables")

# supabase = create_client(supabase_url, supabase_key)


def extract_questions_from_text(text):
    """Extract quiz questions and answers from the text."""
    questions = []

    # Pattern to match numbered questions and their answers
    pattern = r'(\d+)\.\s+(.*?)(?=A:|$)(A:.*?)(?=\d+\.\s+|\Z)'

    matches = re.findall(pattern, text, re.DOTALL)

    for match in matches:
        question_num = match[0].strip()
        question_text = match[1].replace('\n', '').strip()
        answer_text = match[2].replace('A:', '').replace(
            "  ", " ").replace(" )", ")").split("\n")[0].strip()

        question_obj = {
            "number": question_num,
            "question": question_text,
            "answer": answer_text
        }

        questions.append(question_obj)

    return questions


async def extract_from_pdf(pdf_path):
    """Extract text and then questions from a PDF file."""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""

        # Extract questions from the text
        questions = extract_questions_from_text(text)

        return {
            "filename": Path(pdf_path).name,
            "total_questions": len(questions),
            "questions": questions
        }
    except Exception as e:
        print(f"Error extracting from {pdf_path}: {e}")
        return {
            "filename": Path(pdf_path).name,
            "error": str(e),
            "questions": []
        }


async def process_pdf_directory(directory_path):
    """Process all PDFs in a directory and save to Supabase."""
    pdf_dir = Path(directory_path)

    if not pdf_dir.exists():
        print(f"Directory {directory_path} does not exist")
        return

    pdf_files = [f for f in pdf_dir.iterdir() if f.suffix.lower() == '.pdf']

    if not pdf_files:
        print(f"No PDF files found in {directory_path}")
        return

    print(f"Found {len(pdf_files)} PDF files")

    for pdf_file in pdf_files:
        print(f"Processing {pdf_file.name}...")
        result = await extract_from_pdf(pdf_file)

        # Save to local JSON file as backup
        json_path = pdf_file.with_suffix('.json')
        with open(json_path, 'w') as f:
            json.dump(result, f, indent=2)

        print(f"Saved questions to {json_path}")

        try:
            # Save to Supabase
            # response = supabase.table('quiz_questions').insert({
            #     'filename': result['filename'],
            #     'question_count': result['total_questions'],
            #     'questions': result['questions'],
            #     'processed_at': 'now()'
            # }).execute()

            print(f"Successfully processed {pdf_file.name}")
        except Exception as e:
            print(f"Error saving {pdf_file.name} to Supabase: {e}")


async def main():
    """Main entry point."""
    print("Starting PDF quiz extraction...")
    await process_pdf_directory(pdf_directory)
    print("Quiz extraction complete.")

if __name__ == "__main__":
    asyncio.run(main())
