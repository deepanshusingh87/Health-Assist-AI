import os

from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_groq import ChatGroq

load_dotenv()


# --------------------------------------------------
# Configuration
# --------------------------------------------------

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

PINECONE_INDEX_NAME = os.getenv(
    "PINECONE_INDEX_NAME",
    "medicalbot"
)

EMBEDDING_MODEL = "llama-text-embed-v2"


if not PINECONE_API_KEY:
    raise ValueError(
        "PINECONE_API_KEY is missing from .env"
    )


# --------------------------------------------------
# Pinecone Connection
# --------------------------------------------------

pc = Pinecone(
    api_key=PINECONE_API_KEY
)

index = pc.Index(
    PINECONE_INDEX_NAME
)


# --------------------------------------------------
# Detect Question Type
# --------------------------------------------------

def detect_query_type(question):

    question_lower = question.lower()

    # ----------------------------------------------
    # Emergency indicators
    # ----------------------------------------------

    emergency_keywords = [
        "unconscious",
        "not breathing",
        "can't breathe",
        "cannot breathe",
        "difficulty breathing",
        "severe breathing",
        "chest pain",
        "heart attack",
        "stroke",
        "seizure",
        "fainted",
        "fainting",
        "severe bleeding",
        "bleeding heavily",
        "anaphylaxis",
        "severe allergic",
        "poisoning",
        "overdose",
        "choking",
        "collapsed",
        "collapse",
        "suicide",
        "suicidal",
        "severe burn"
    ]

    for keyword in emergency_keywords:
        if keyword in question_lower:
            return "emergency"


    # ----------------------------------------------
    # Self-care / symptom-relief indicators
    # ----------------------------------------------

    self_care_keywords = [
        "what should i do",
        "what can i do",
        "what to do",
        "home remedy",
        "home remedies",
        "self care",
        "self-care",
        "relief",
        "temporary relief",
        "pain",
        "ache",
        "toothache",
        "tooth pain",
        "headache",
        "sore throat",
        "cold",
        "cough",
        "fever",
        "vomiting",
        "diarrhea",
        "diarrhoea",
        "constipation",
        "indigestion",
        "heartburn",
        "back pain",
        "neck pain",
        "sprain",
        "strain",
        "burn",
        "cut",
        "wound",
        "nosebleed",
        "insect bite",
        "sting",
        "mouth ulcer",
        "dizziness",
        "bloating",
        "cramps",
        "earache",
        "sunburn"
    ]

    for keyword in self_care_keywords:
        if keyword in question_lower:
            return "self_care"

    return "general"


# --------------------------------------------------
# Query One Pinecone Category
# --------------------------------------------------

def query_category(
    vector,
    category,
    top_k
):

    results = index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True,
        filter={
            "category": {
                "$eq": category
            }
        }
    )

    return results.matches


# --------------------------------------------------
# Retrieve Medical Context
# --------------------------------------------------

def retrieve_medical_context(question):

    # Convert question into embedding
    query_embedding = pc.inference.embed(
        model=EMBEDDING_MODEL,
        inputs=[question],
        parameters={
            "input_type": "query",
            "truncate": "END"
        }
    )

    vector = query_embedding[0].values

    query_type = detect_query_type(
        question
    )

    matches = []


    # --------------------------------------------------
    # SELF-CARE QUESTION
    #
    # Main information:
    # self-care PDF
    #
    # Supporting information:
    # general medical book
    # emergency care
    # --------------------------------------------------

    if query_type == "self_care":

        matches.extend(
            query_category(
                vector,
                "self_care",
                5
            )
        )

        matches.extend(
            query_category(
                vector,
                "general",
                2
            )
        )

        matches.extend(
            query_category(
                vector,
                "emergency",
                1
            )
        )


    # --------------------------------------------------
    # EMERGENCY QUESTION
    #
    # Main information:
    # WHO emergency care
    #
    # Supporting:
    # self-care corpus
    # general medical reference
    # --------------------------------------------------

    elif query_type == "emergency":

        matches.extend(
            query_category(
                vector,
                "emergency",
                5
            )
        )

        matches.extend(
            query_category(
                vector,
                "self_care",
                2
            )
        )

        matches.extend(
            query_category(
                vector,
                "general",
                1
            )
        )


    # --------------------------------------------------
    # GENERAL MEDICAL QUESTION
    #
    # Main information:
    # general medical reference
    #
    # Supporting:
    # self-care corpus
    # --------------------------------------------------

    else:

        matches.extend(
            query_category(
                vector,
                "general",
                5
            )
        )

        matches.extend(
            query_category(
                vector,
                "self_care",
                2
            )
        )


    # --------------------------------------------------
    # Sort results by similarity score
    # --------------------------------------------------

    matches = sorted(
        matches,
        key=lambda match: match.score,
        reverse=True
    )


    # --------------------------------------------------
    # Remove duplicate chunks
    # --------------------------------------------------

    unique_matches = []
    seen_ids = set()

    for match in matches:

        if match.id not in seen_ids:

            seen_ids.add(
                match.id
            )

            unique_matches.append(
                match
            )


    # Limit total context
    unique_matches = unique_matches[:8]


    contexts = []
    sources = []


    # --------------------------------------------------
    # Build Context
    # --------------------------------------------------

    for match in unique_matches:

        metadata = match.metadata or {}

        text = metadata.get(
            "text"
        )

        if not text:
            continue


        source = metadata.get(
            "source",
            "Unknown source"
        )

        page = metadata.get(
            "page"
        )

        category = metadata.get(
            "category",
            "general"
        )


        # Add source information directly
        # around retrieved context
        context_block = (
            f"SOURCE: {source}\n"
            f"PAGE: {page}\n"
            f"CATEGORY: {category}\n\n"
            f"{text}"
        )

        contexts.append(
            context_block
        )


        sources.append({
            "source": source,
            "page": page,
            "category": category,
            "score": match.score
        })


    combined_context = (
        "\n\n"
        "----------------------------------------"
        "\n\n"
    ).join(contexts)


    return (
        combined_context,
        sources,
        query_type
    )


# --------------------------------------------------
# Generate Medical Response
# --------------------------------------------------

def get_medical_response(question):

    groq_api_key = os.getenv(
        "GROQ_API_KEY"
    )

    if not groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is missing from .env"
        )


    # --------------------------------------------------
    # Retrieve RAG Context
    # --------------------------------------------------

    context, sources, query_type = (
        retrieve_medical_context(
            question
        )
    )


    if not context:

        return (
            "I could not find enough relevant "
            "information in the medical knowledge "
            "base. Please consult a qualified "
            "healthcare professional for guidance."
        )


    # --------------------------------------------------
    # Groq LLM
    # --------------------------------------------------

    llm = ChatGroq(
        api_key=groq_api_key,
        model="openai/gpt-oss-120b",
        temperature=0.2
    )


    # --------------------------------------------------
    # Improved Medical Prompt
    # --------------------------------------------------

    prompt = f"""
You are Health Assist AI, a medical information and
supportive-care assistant.

Your job is to give a clear, practical, safe and
easy-to-understand answer based on the retrieved
medical knowledge below.

QUESTION TYPE:
{query_type}

RETRIEVED MEDICAL KNOWLEDGE:

{context}

USER QUESTION:

{question}


IMPORTANT GROUNDING RULES:

1. Base medical claims primarily on the retrieved
   medical knowledge.

2. Do not invent treatments, home remedies,
   diagnoses, medication doses or medical facts
   that are not supported by the retrieved context.

3. Information from the supportive-care corpus
   should be preferred for practical temporary
   symptom-relief instructions.

4. Information from the emergency corpus should
   take priority whenever serious warning signs
   or emergency symptoms are present.

5. General medical-reference information can be
   used to explain the condition, possible causes
   and background information.

6. Do not diagnose the user.

7. Do not tell the user to start, stop or change
   prescription medication.

8. If medication suitability depends on age,
   pregnancy, allergies, medical conditions,
   interactions or other personal factors,
   recommend checking with a doctor or pharmacist.

9. Clearly distinguish temporary symptom relief
   from treatment of the underlying cause.

10. Never present a home-care measure as a cure
    unless the retrieved context explicitly
    supports that statement.


RESPONSE STYLE:

- Start by answering the user's question directly.
- Keep the opening explanation short and clear, normally 2 to 4 sentences.
- Do not repeat the user's question.
- Do not start with a long medical explanation.
- Do not use tables unless the user specifically asks for a table.
- Do not create comparison tables for causes, symptoms, treatments or self-care.
- Do not add a "Quick recap" or conclusion that repeats information already given.
- Do not end with generic phrases such as "Take care" or "Don't hesitate to reach out."
- Do not repeat the same advice or warning in multiple sections.

FOR SYMPTOM OR SELF-CARE QUESTIONS:

Use this structure when the retrieved context supports it:

### What may be causing it

Give a short explanation in one paragraph.
If several common causes are relevant, use a short bullet list instead of a table.

### What you can do now

Give practical and safe temporary self-care steps.
Put the most useful actions first.
Only include actions supported by the retrieved medical context.

### When to see a healthcare professional

Explain clearly when the symptom needs professional assessment.

### Get urgent medical help if

Include only important emergency warning signs supported by the retrieved context.

Add sections such as "What to avoid" or "Why this may help" only when they add useful information.
Do not create sections simply to make the answer longer.


FOR GENERAL INFORMATION QUESTIONS:

If the user asks something such as:

"What is diabetes?"
"What causes asthma?"
"What is tuberculosis?"

do not force the self-care structure.

Instead explain naturally:

- what the condition is
- important symptoms or features
- common causes or risk factors when supported
- how it is generally managed
- important warning signs
- prevention when relevant


FOR EMERGENCY QUESTIONS:

If the retrieved information indicates a possible medical emergency:

- Put the emergency action first.
- Keep emergency instructions direct and easy to follow.
- Do not bury emergency advice below general educational information.
- Do not provide lengthy home-remedy advice that could delay emergency treatment.


LANGUAGE AND FORMATTING:

- Use simple, natural and easy-to-understand language.
- Use Markdown headings with ### when headings are useful.
- Use bullet points for lists.
- Use **bold** only for genuinely important information.
- Keep related information together instead of putting every sentence on a separate line.
- Keep paragraphs short and readable.
- Do not use Markdown tables unless the user specifically requests a table.
- Do not output HTML tags such as <br>, <br/> or <br />.
- Do not output escaped table characters such as \|.
- Do not put an entire list or table on one line.
- Do not create unnecessary blank lines.
- Do not over-format the response.
- Give enough explanation to be useful without unnecessary repetition.
- Clearly distinguish temporary symptom relief from treatment of the underlying cause.
- Clearly explain when professional or emergency medical care is necessary.
"""


    # --------------------------------------------------
    # Generate Answer
    # --------------------------------------------------

    response = llm.invoke(
        prompt
    )

    answer = response.content


    # --------------------------------------------------
    # Add Sources
    # --------------------------------------------------

    unique_sources = []

    for source in sources:

        source_name = source[
            "source"
        ]

        page = source[
            "page"
        ]

        if page:

            source_text = (
                f"{source_name} "
                f"- Page {page}"
            )

        else:

            source_text = source_name


        if (
            source_text
            not in unique_sources
        ):

            unique_sources.append(
                source_text
            )


    if unique_sources:

        answer += "\n\n### Sources\n"

        for source in unique_sources:

            answer += (
                f"- {source}\n"
            )


    return answer