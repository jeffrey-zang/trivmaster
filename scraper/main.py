import os
import re
import PyPDF2
import json
from pathlib import Path

def extract_sections_and_questions(text):
    """Extract sections and their questions from quiz text."""
    # First, preprocess the text to identify section headers
    lines = text.split('\n')
    
    # Process line by line to identify section headers
    sections = []
    current_section = {"title": "Introduction", "questions": []}
    in_question = False
    current_question = None
    ignore_line = False
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
        
        # Ignore lines with just "quarter" in them - we'll use the next heading
        if re.match(r'^[A-Z\s]*(QUARTER|HALF)[A-Z\s]*$', line):
            ignore_line = True
            continue
            
        # Check if line is a section header (not a question and not an answer)
        if not re.match(r'^\d+\.', line) and not line.startswith('A:'):
            # If we find keywords that typically indicate a section, start a new section
            section_keywords = ["Blitz", "Jumps", "Set of", "Jackpot", "Streak", "Splits:"]
            
            if any(keyword in line for keyword in section_keywords) or line.isupper():
                if ignore_line:
                    ignore_line = False
                # Save previous section if it has questions and is not End of Game
                if current_section["questions"] and "END OF GAME" not in current_section["title"]:
                    sections.append(current_section)
                
                # Start new section
                current_section = {"title": line, "questions": []}
                continue
                
        # If we were ignoring waiting for next line, don't ignore anymore
        ignore_line = False
        
        # Check if line starts a question
        question_match = re.match(r'^(\d+)\.\s+(.*)', line)
        if question_match:
            # If we were processing a question, save it
            if current_question and current_question["answers"]:
                current_section["questions"].append(current_question)
            
            # Start new question
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
            
        # Check if line is an answer
        answer_match = re.match(r'^A:\s*(.*)', line)
        if answer_match and in_question and current_question:
            answer = answer_match.group(1)
            if answer.strip():
                answer = answer.replace("  ", " ").replace(" )", ")").replace(" ,", ",").replace(" s ", "s ").replace(" s)", "s)")

                answer_parts = answer.split(" OR ")
                for part in answer_parts:
                    part = part.strip()
                    # First get the base answer (everything before any parentheses)
                    base_answer = part.split("(")[0].strip()
                    if base_answer:
                        if "[" in base_answer:
                            current_question["answers"].append(base_answer.split("[")[0].strip())
                        else:
                            current_question["answers"].append(base_answer)
                    
                    # Then handle any parenthetical modifiers
                    if "(accept" in part:
                        accept_text = part.split("(accept")[1].split(")")[0].replace(": ", "")
                        for accepted in accept_text.split(","):
                            current_question["answers"].append(accepted.strip())
                    if "(reject" in part:
                        reject_text = part.split("(reject")[1].split(")")[0].replace(": ", "")
                        for rejected in reject_text.split(","):
                            current_question["reject"].append(rejected.strip())
                    if "(prompt on" in part:
                        prompt_text = part.split("(prompt on")[1].split(")")[0].replace(": ", "")
                        for prompted in prompt_text.split(","):
                            current_question["prompt"].append(prompted.strip())
            continue
            
        # If we're in a question but it's not an answer line, append to question text
        if in_question and current_question:
            # Only append if it's not another question starting
            if not re.match(r'^\d+\.', line):
                current_question["question"] += " " + line
            else:
                # If we hit another question, save the current one and start new
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
    
    # Add the last question if there is one
    if current_question and current_question["answers"]:
        current_section["questions"].append(current_question)
    
    # Add the last section if it has questions and is not End of Game
    if current_section["questions"] and "END OF GAME" not in current_section["title"]:
        sections.append(current_section)
    
    return sections

def extract_from_pdf(pdf_path):
    """Extract sections and questions from a PDF file."""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        
        # Extract sections and questions from the text
        sections = extract_sections_and_questions(text)
        
        # Count total questions
        total_questions = sum(len(section["questions"]) for section in sections)
        
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
        
        # Save to JSON file
        json_path = pdf_file.with_suffix('.json')
        with open(json_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Saved to {json_path}")
        total_questions = sum(len(section["questions"]) for section in result["sections"])
        print(f"  - Extracted {total_questions} questions in {len(result['sections'])} sections")

def main():
    """Main entry point."""
    pdf_directory = "./pdfs"
    print("Starting PDF quiz extraction...")
    process_pdf_directory(pdf_directory)
    print("Quiz extraction complete.")

if __name__ == "__main__":
    main()