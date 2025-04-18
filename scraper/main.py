import os
import re
import PyPDF2
import json
from pathlib import Path


def extract_sections_and_questions(text):
    """Extract sections and their questions from quiz text."""
    lines = text.split('\n')

    sections = []
    current_section = {"title": "Introduction", "questions": []}
    in_question = False
    current_question = None
    ignore_line = False

    for line in lines:
        line = line.strip()

        if not line:
            continue

        if re.match(r'^[A-Z\s]*(QUARTER|HALF)[A-Z\s]*$', line):
            ignore_line = True
            continue

        if not re.match(r'^\d+\.', line) and not line.startswith('A:'):
            section_keywords = ["Blitz", "Jumps",
                                "Set of", "Jackpot", "Streak", "Splits:"]

            if any(keyword in line for keyword in section_keywords) or line.isupper():
                if ignore_line:
                    ignore_line = False
                if current_section["questions"] and "END OF GAME" not in current_section["title"]:
                    sections.append(current_section)

                current_section = {"title": line, "questions": []}
                continue

        ignore_line = False

        question_match = re.match(r'^(\d+)\.\s+(.*)', line)
        if question_match:
            if current_question and current_question["answers"]:
                current_section["questions"].append(current_question)

            question_num = question_match.group(1)
            question_text = question_match.group(2).replace(" ,", ",")
            current_question = {
                "number": question_num,
                "question": question_text,
                "answers": [],
                "prompt": [],
                "reject": []
            }
            in_question = True
            continue

        answer_match = re.match(r'^A:\s*(.*)', line)
        if answer_match and in_question and current_question:
            answer = answer_match.group(1)
            if answer.strip():
                answer = answer.replace("  ", " ").replace(" )", ")").replace(
                    " ,", ",").replace(" s ", "s ").replace(" s)", "s)")

                answer_parts = answer.split(" OR ")
                for part in answer_parts:
                    part = part.strip()
                    base_answer = part.split("(")[0].strip()
                    if base_answer:

                        current_question["answers"].append(base_answer)

                    if "(accept" in part:
                        accept_text = part.split("(accept")[1].split(")")[
                            0].replace(": ", "")
                        for accepted in accept_text.split(","):
                            current_question["answers"].append(
                                accepted.strip())
                    if "(reject" in part:
                        reject_text = part.split("(reject")[1].split(")")[
                            0].replace(": ", "")
                        for rejected in reject_text.split(","):
                            current_question["reject"].append(rejected.strip())
                    if "(prompt on" in part:
                        prompt_text = part.split("(prompt on")[1].split(")")[
                            0].replace(": ", "")
                        for prompted in prompt_text.split(","):
                            current_question["prompt"].append(prompted.strip())
            continue

        if in_question and current_question:
            if not re.match(r'^\d+\.', line):
                current_question["question"] += " " + line
            else:
                if current_question:
                    current_section["questions"].append(current_question)
                question_num = re.match(r'^(\d+)\.\s+(.*)', line).group(1)
                question_text = re.match(r'^(\d+)\.\s+(.*)', line).group(2)
                current_question = {
                    "number": question_num,
                    "question": question_text,
                    "answers": [],
                    "prompt": [],
                    "reject": []
                }

    if current_question and current_question["answers"]:
        current_section["questions"].append(current_question)

    if current_section["questions"] and "END OF GAME" not in current_section["title"]:
        sections.append(current_section)

    return sections


def analyze_pdf_formatting(pdf_path):
    """Analyze PDF to find bold text in answers."""
    try:
        import fitz
        bold_answers = {}

        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc):

            blocks = page.get_text("dict")["blocks"]
            for block in blocks:
                if block["type"] == 0:
                    for line in block["lines"]:
                        line_text = ""
                        bold_parts = []

                        for span in line["spans"]:
                            line_text += span["text"]

                        if "A:" in line_text:

                            for span in line["spans"]:
                                text = span["text"].strip()
                                if not text:
                                    continue

                                is_bold = False
                                font = span["font"].lower()
                                if "bold" in font or "heavy" in font or span.get("flags", 0) & 2**4 != 0:
                                    is_bold = True
                                    bold_parts.append(text)

                            if bold_parts:
                                bold_answers[line_text] = bold_parts

        doc.close()
        return bold_answers
    except ImportError:
        print("PyMuPDF (fitz) not installed. Bold text detection will be skipped.")
        return {}
    except Exception as e:
        print(f"Error analyzing PDF formatting: {e}")
        return {}


def extract_from_pdf(pdf_path):
    """Extract sections and questions from a PDF file."""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

        sections = extract_sections_and_questions(text)

        try:
            bold_answers = analyze_pdf_formatting(pdf_path)

            if bold_answers:
                for section in sections:
                    for question in section["questions"]:
                        enhanced_answers = []
                        for answer in question["answers"]:

                            matched_line = None
                            for line, bold_parts in bold_answers.items():
                                if answer in line:
                                    matched_line = line
                                    break

                            if matched_line:

                                required_parts = []
                                for bold_part in bold_answers[matched_line]:
                                    if bold_part in answer:
                                        required_parts.append(bold_part)

                                if required_parts:

                                    answer_obj = {
                                        "text": answer,
                                        "required": required_parts
                                    }

                                    optional_parts = answer
                                    for req in required_parts:
                                        optional_parts = optional_parts.replace(
                                            req, "")

                                    optional_parts = [p.strip() for p in re.split(
                                        r'\s+', optional_parts) if p.strip()]
                                    if optional_parts:
                                        answer_obj["optional"] = optional_parts

                                    enhanced_answers.append(answer_obj)
                                else:
                                    enhanced_answers.append({
                                        "text": answer,
                                        "required": [answer],
                                        "optional": []
                                    })
                            else:
                                enhanced_answers.append({
                                    "text": answer,
                                    "required": [answer],
                                    "optional": []
                                })

                        question["answers"] = enhanced_answers
        except Exception as e:
            print(f"Error processing bold text: {e}")

        total_questions = sum(len(section["questions"])
                              for section in sections)

        return {
            "filename": Path(pdf_path).name,
            "total_questions": total_questions,
            "sections": sections
        }
    except Exception as e:
        print(f"Error extracting from {pdf_path}: {e}")
        return {
            "filename": Path(pdf_path).name,
            "error": str(e),
            "sections": []
        }


def process_pdf_directory(directory_path):
    """Process all PDFs in a directory and save to JSON files."""
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
        result = extract_from_pdf(pdf_file)

        json_path = Path(str(pdf_file).replace(
            "pdfs/", "results/")).with_suffix('.json')
        with open(json_path, 'w') as f:
            json.dump(result, f, indent=2)

        print(f"Saved to {json_path}")
        total_questions = sum(len(section["questions"])
                              for section in result["sections"])
        print(
            f"  - Extracted {total_questions} questions in {len(result['sections'])} sections")


def main():
    """Main entry point."""
    pdf_directory = "./pdfs"
    print("Starting PDF quiz extraction...")

    process_pdf_directory(pdf_directory)
    print("Quiz extraction complete.")


if __name__ == "__main__":
    main()
