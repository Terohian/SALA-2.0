import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_questions():
    prompt = """
    Generate a JSON object containing multiple-choice questions for computer science subjects.
    The root keys must be exactly: "ds" (Data Structures), "algo" (Algorithms), "db" (Databases), "oop" (Object Oriented Programming), "net" (Networks), "os" (Operating Systems).
    Each key should contain an array of 5 question objects.
    Each question object MUST have these exact keys:
    - "id": A unique string ID (e.g., "ds_1")
    - "text": The question text
    - "options": An array of exactly 4 string options
    - "correctAnswer": An integer (0 to 3) representing the index of the correct option
    - "difficulty": String ("easy", "medium", or "hard")
    - "skill": A short string representing the sub-topic (e.g., "trees", "sorting")
    - "hint": A helpful hint string
    - "feedback": An object with "correct" and "wrong" string properties explaining why.
    """
    
    print("Asking Gemini to generate your curriculum... Patience")
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
       
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    questions_data = json.loads(response.text)

    os.makedirs('models', exist_ok=True)
    with open('./models/sala-question-bank.json', 'w') as f:
        json.dump(questions_data, f, indent=4)
    
    print("Done! Adaptive question bank successfully saved to models/sala-question-bank.json")

if __name__ == "__main__":
    generate_questions()