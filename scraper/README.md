# Consensus Scraper

This Python script extracts text from Consensus PDFs and stores the content in a Supabase database.

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

## Functionality

Put pdfs in `/pdfs`. Results will be saved as JSON in `/results`. These are gitignored because I don't want to push all of our packs to GitHub.

You can use the `storage.py` script to store all of the pack data (from `/results`) in Supabase.
