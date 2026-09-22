import os
import time

from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone

load_dotenv()

# -----------------------------------
# Basic configuration
# -----------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PDF_FOLDER = os.path.join(
    BASE_DIR,
    "data",
    "medical_pdfs"
)

INDEX_NAME = os.getenv(
    "PINECONE_INDEX_NAME",
    "medicalbot"
)

EMBEDDING_MODEL = "llama-text-embed-v2"
BATCH_SIZE = 20


# -----------------------------------
# PDF metadata configuration
# -----------------------------------

def get_pdf_metadata(pdf_filename):

    filename = pdf_filename.lower()

    # Self-care / temporary relief knowledge
    if filename == "self_care_v3.pdf":
        return {
            "category": "self_care",
            "corpus_type": "supportive_care",
            "priority": 3
        }

    # Emergency and first-aid knowledge
    elif filename == "who_basic_emergency_care.pdf":
        return {
            "category": "emergency",
            "corpus_type": "emergency_care",
            "priority": 3
        }

    # General medical reference book
    elif filename == "medical_book.pdf":
        return {
            "category": "general",
            "corpus_type": "medical_reference",
            "priority": 1
        }

    # Any future PDF
    else:
        return {
            "category": "general",
            "corpus_type": "medical_reference",
            "priority": 1
        }


# -----------------------------------
# Check PDF folder
# -----------------------------------

if not os.path.exists(PDF_FOLDER):
    raise FileNotFoundError(
        f"PDF folder not found: {PDF_FOLDER}"
    )

pdf_files = [
    file
    for file in os.listdir(PDF_FOLDER)
    if file.lower().endswith(".pdf")
]

if not pdf_files:
    raise FileNotFoundError(
        "No PDF files found in medical_pdfs folder."
    )

print(f"PDF files found: {len(pdf_files)}")

for file in pdf_files:
    metadata = get_pdf_metadata(file)

    print(
        f"- {file} "
        f"[category={metadata['category']}, "
        f"priority={metadata['priority']}]"
    )


# -----------------------------------
# Connect Pinecone
# -----------------------------------

api_key = os.getenv("PINECONE_API_KEY")

if not api_key:
    raise ValueError(
        "PINECONE_API_KEY is missing from .env"
    )

pc = Pinecone(
    api_key=api_key
)

index = pc.Index(
    INDEX_NAME
)

print("\nPinecone connected successfully!")
print("Using index:", INDEX_NAME)


# -----------------------------------
# Text splitter
# -----------------------------------

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150
)


# -----------------------------------
# Process every PDF
# -----------------------------------

for pdf_filename in pdf_files:

    pdf_path = os.path.join(
        PDF_FOLDER,
        pdf_filename
    )

    # Get metadata for current PDF
    pdf_metadata = get_pdf_metadata(
        pdf_filename
    )

    print("\n================================")
    print("Processing:", pdf_filename)
    print(
        "Category:",
        pdf_metadata["category"]
    )
    print(
        "Corpus Type:",
        pdf_metadata["corpus_type"]
    )
    print(
        "Priority:",
        pdf_metadata["priority"]
    )
    print("================================")

    reader = PdfReader(
        pdf_path
    )

    total_pages = len(
        reader.pages
    )

    print(
        "Total pages:",
        total_pages
    )

    chunks = []


    # -----------------------------------
    # Extract and split PDF text
    # -----------------------------------

    for page_number, page in enumerate(
        reader.pages
    ):

        try:

            text = page.extract_text()

            if not text or not text.strip():
                continue

            split_texts = (
                text_splitter.split_text(
                    text.strip()
                )
            )

            for chunk_number, chunk_text in enumerate(
                split_texts
            ):

                chunks.append({
                    "text": chunk_text,
                    "page": page_number + 1,
                    "chunk": chunk_number
                })

            if (
                page_number + 1
            ) % 50 == 0:

                print(
                    f"Processed "
                    f"{page_number + 1}/"
                    f"{total_pages} pages..."
                )

        except Exception as e:

            print(
                f"Could not process page "
                f"{page_number + 1}: {e}"
            )


    print(
        "Chunks created:",
        len(chunks)
    )


    # -----------------------------------
    # Safe filename for vector IDs
    # -----------------------------------

    safe_filename = (
        os.path.splitext(
            pdf_filename
        )[0]
        .replace(" ", "_")
        .lower()
    )


    # -----------------------------------
    # Create embeddings and upload
    # -----------------------------------

    for start in range(
        0,
        len(chunks),
        BATCH_SIZE
    ):

        batch = chunks[
            start:start + BATCH_SIZE
        ]

        batch_texts = [
            item["text"]
            for item in batch
        ]


        # -----------------------------------
        # Pinecone hosted embeddings
        # -----------------------------------

        embeddings = pc.inference.embed(
            model=EMBEDDING_MODEL,
            inputs=batch_texts,
            parameters={
                "input_type": "passage",
                "truncate": "END"
            }
        )


        # -----------------------------------
        # Prepare vectors
        # -----------------------------------

        vectors = []

        for item, embedding in zip(
            batch,
            embeddings
        ):

            vector_id = (
                f"{safe_filename}_"
                f"page_{item['page']}_"
                f"chunk_{item['chunk']}"
            )

            vectors.append({
                "id": vector_id,

                "values": embedding.values,

                "metadata": {

                    # Actual medical text
                    "text": item["text"],

                    # PDF information
                    "source": pdf_filename,
                    "page": item["page"],
                    "chunk": item["chunk"],

                    # Knowledge category
                    "category":
                        pdf_metadata[
                            "category"
                        ],

                    # Corpus type
                    "corpus_type":
                        pdf_metadata[
                            "corpus_type"
                        ],

                    # Retrieval priority
                    "priority":
                        pdf_metadata[
                            "priority"
                        ]
                }
            })


        # -----------------------------------
        # Upload to Pinecone
        # -----------------------------------

        index.upsert(
            vectors=vectors
        )


        completed = min(
            start + BATCH_SIZE,
            len(chunks)
        )

        print(
            f"Uploaded "
            f"{completed}/"
            f"{len(chunks)} chunks"
        )

        time.sleep(0.5)


    print(
        f"Completed: {pdf_filename}"
    )


# -----------------------------------
# Finished
# -----------------------------------

print("\n================================")
print("ALL PDFs INGESTED SUCCESSFULLY!")
print("================================")


# Give Pinecone a moment to update stats
time.sleep(2)


# -----------------------------------
# Pinecone statistics
# -----------------------------------

stats = index.describe_index_stats()

print("\nPinecone Index Statistics:")
print(stats)