import os
import time

from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone



load_dotenv()



BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

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

# CATEGORY CONFIGURATION

CATEGORY_CONFIG = {

    "general": {
        "category": "general",
        "corpus_type": "medical_reference",
        "priority": 1
    },

    "self_care": {
        "category": "self_care",
        "corpus_type": "supportive_care",
        "priority": 3
    },

    "emergency": {
        "category": "emergency",
        "corpus_type": "emergency_care",
        "priority": 3
    }
}

# CHECK MAIN PDF FOLDER

if not os.path.exists(PDF_FOLDER):

    raise FileNotFoundError(
        f"PDF folder not found: {PDF_FOLDER}"
    )

# FIND PDFs FROM CATEGORY FOLDERS


pdf_files = []


for folder_name, metadata in CATEGORY_CONFIG.items():

    category_folder = os.path.join(
        PDF_FOLDER,
        folder_name
    )

    # Skip missing category folders
    if not os.path.exists(category_folder):

        print(
            f"Warning: folder not found: "
            f"{category_folder}"
        )

        continue


    # Find PDFs inside category folder
    for file in os.listdir(category_folder):

        if not file.lower().endswith(".pdf"):
            continue

        full_path = os.path.join(
            category_folder,
            file
        )

        # Ignore folders accidentally matching .pdf
        if not os.path.isfile(full_path):
            continue

        pdf_files.append({
            "filename": file,
            "path": full_path,
            "folder": folder_name,
            "category": metadata["category"],
            "corpus_type": metadata["corpus_type"],
            "priority": metadata["priority"]
        })

# CHECK IF ANY PDF WAS FOUND

if not pdf_files:

    raise FileNotFoundError(
        "No PDF files found inside general, "
        "self_care, or emergency folders."
    )

# DISPLAY DISCOVERED PDFs

print("\n================================")
print("MEDICAL PDFs FOUND")
print("================================")

print(
    f"Total PDF files found: "
    f"{len(pdf_files)}"
)


for pdf in pdf_files:

    print(
        f"- {pdf['filename']} "
        f"[category={pdf['category']}, "
        f"corpus_type={pdf['corpus_type']}, "
        f"priority={pdf['priority']}]"
    )

# CONNECT TO PINECONE
api_key = os.getenv(
    "PINECONE_API_KEY"
)

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


print("\n================================")
print("PINECONE CONNECTED")
print("================================")

print(
    "Using index:",
    INDEX_NAME
)

# TEXT SPLITTER

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150
)

# PROCESS EVERY PDF

for pdf in pdf_files:

    pdf_filename = pdf["filename"]

    pdf_path = pdf["path"]

    category = pdf["category"]

    corpus_type = pdf["corpus_type"]

    priority = pdf["priority"]


    print("\n================================")
    print(
        "Processing:",
        pdf_filename
    )

    print(
        "Category:",
        category
    )

    print(
        "Corpus Type:",
        corpus_type
    )

    print(
        "Priority:",
        priority
    )

    print("================================")

    # OPEN PDF
    try:

        reader = PdfReader(
            pdf_path
        )

    except Exception as e:

        print(
            f"Could not open PDF "
            f"{pdf_filename}: {e}"
        )

        print(
            f"Skipping: {pdf_filename}"
        )

        continue


    total_pages = len(
        reader.pages
    )


    print(
        "Total pages:",
        total_pages
    )


    chunks = []

    # EXTRACT TEXT PAGE BY PAGE
  

    for page_number, page in enumerate(
        reader.pages
    ):

        try:

            text = page.extract_text()


            # Skip blank pages
            if (
                not text
                or not text.strip()
            ):

                continue


            cleaned_text = text.strip()


            # Split page text into chunks
            split_texts = (
                text_splitter.split_text(
                    cleaned_text
                )
            )


            for chunk_number, chunk_text in enumerate(
                split_texts
            ):

                if not chunk_text.strip():
                    continue


                chunks.append({

                    "text":
                        chunk_text.strip(),

                    "page":
                        page_number + 1,

                    "chunk":
                        chunk_number
                })


            # Progress display
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
    # CHUNK RESULT

    print(
        "Chunks created:",
        len(chunks)
    )


    # If PDF produced no readable text
    if not chunks:

        print(
            f"WARNING: No readable text found "
            f"in {pdf_filename}."
        )

        print(
            f"Skipping Pinecone upload for "
            f"{pdf_filename}."
        )

        continue

    # SAFE FILENAME FOR VECTOR IDs

    safe_filename = (
        os.path.splitext(
            pdf_filename
        )[0]
        .replace(" ", "_")
        .replace("-", "_")
        .lower()
    )
    # CREATE EMBEDDINGS IN BATCHES

    for start in range(
        0,
        len(chunks),
        BATCH_SIZE
    ):

        batch = chunks[
            start:
            start + BATCH_SIZE
        ]


        batch_texts = [

            item["text"]

            for item in batch
        ]
        # PINECONE HOSTED EMBEDDINGS
       

        try:

            embeddings = pc.inference.embed(

                model=EMBEDDING_MODEL,

                inputs=batch_texts,

                parameters={
                    "input_type": "passage",
                    "truncate": "END"
                }
            )

        except Exception as e:

            print(
                f"Embedding error for "
                f"{pdf_filename}: {e}"
            )

            raise

        # PREPARE VECTORS
       

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

                "id":
                    vector_id,

                "values":
                    embedding.values,

                "metadata": {

                    # Actual medical content
                    "text":
                        item["text"],

                    # Source document
                    "source":
                        pdf_filename,

                    # Source folder/category
                    "source_folder":
                        pdf["folder"],

                    # Page/chunk location
                    "page":
                        item["page"],

                    "chunk":
                        item["chunk"],

                    # RAG category
                    "category":
                        category,

                    # Knowledge corpus type
                    "corpus_type":
                        corpus_type,

                    # Retrieval priority
                    "priority":
                        priority
                }
            })
        # UPLOAD VECTORS TO PINECONE

        try:

            index.upsert(
                vectors=vectors
            )

        except Exception as e:

            print(
                f"Pinecone upload error "
                f"for {pdf_filename}: {e}"
            )

            raise


        completed = min(
            start + BATCH_SIZE,
            len(chunks)
        )


        print(
            f"Uploaded "
            f"{completed}/"
            f"{len(chunks)} chunks"
        )


        time.sleep(
            0.5
        )


    print(
        f"Completed: "
        f"{pdf_filename}"
    )

# FINISHED

print("\n================================")
print("ALL AVAILABLE PDFs PROCESSED!")
print("================================")


# Give Pinecone a moment to update stats
time.sleep(
    2
)

# PINECONE STATISTICS

stats = (
    index.describe_index_stats()
)


print(
    "\nPinecone Index Statistics:"
)

print(
    stats
)