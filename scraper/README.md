# Question to Supabase Scraper

This Python utility extracts text from Consensus PDFs and stores the content in a Supabase database.

## Features

- Extract text from multiple PDF files
- Save extracted content to Supabase database
- Configurable through environment variables
- Simple command-line interface

## Prerequisites

- Python 3.7+
- Supabase account and project
- PDF files to process

## Setup

1. Create a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip -r requirements.txt
```

## Configuration

1. Create a `.env` file in the project directory with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
PDF_DIRECTORY=./pdfs
```

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key or anon key with appropriate permissions
- `PDF_DIRECTORY`: Path to the directory containing your PDF files

2. Create a `pdfs` directory in your project folder and place your PDF files inside it:

```bash
mkdir pdfs
# Copy your PDF files to this directory
```

## Supabase Setup

1. Create a new table in your Supabase project named `pdf_contents` with the following columns:

| Column Name  | Type        | Description                  |
| ------------ | ----------- | ---------------------------- |
| id           | uuid        | Primary key (auto-generated) |
| filename     | text        | Name of the PDF file         |
| content      | text        | Extracted text content       |
| processed_at | timestamptz | When the PDF was processed   |

SQL for creating the table:

```sql
CREATE TABLE pdf_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  content TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Usage

Run the script from the command line:

```bash
python scraper.py
```

The script will:

1. Read all PDF files from the specified directory
2. Extract text content from each PDF
3. Save the extracted text to the Supabase database
4. Output progress information to the console

## Troubleshooting

- **PDF Extraction Issues**: If you're having trouble extracting text from specific PDFs, they may be scanned images rather than text-based PDFs. Consider using OCR tools like Tesseract in combination with this script.

- **Supabase Connection Issues**: Make sure your Supabase URL and key are correct, and that the table has been created with the correct structure.

- **Large PDF Files**: For very large PDF files, you might need to process them page by page instead of loading the entire document at once.

## Extending the Script

This basic script can be extended in several ways:

- Add multithreading for processing multiple PDFs simultaneously
- Implement OCR capabilities for scanned documents
- Add metadata extraction (author, creation date, etc.)
- Create a web interface for monitoring the extraction process

## License

[MIT License](LICENSE)
