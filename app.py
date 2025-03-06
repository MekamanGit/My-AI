from flask import Flask, render_template, request, jsonify
import requests
from config import GROQ_API_KEY

app = Flask(__name__)

@app.route('/')
def voice():
    return render_template('voice.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        
        system_prompt = """I am a bot here to help you. My responses will be:
        - Casual and warm, but direct
        - Brief and concise (1-2 sentences)
        - Natural but without greetings or introductions
        - Show personality while keeping it concise
        Remember to maintain a consistent friendly personality throughout the conversation."""

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mixtral-8x7b-32768",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 50,
                "temperature": 0.7
            }
        )
        
        response.raise_for_status()
        ai_response = response.json()["choices"][0]["message"]["content"]
        return jsonify({"response": ai_response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/text')
def text():
    return render_template('text.html')

@app.route('/view_logs')
def view_logs():
    try:
        with open(logger.log_file, 'r', encoding='utf-8') as f:
            logs = [json.loads(line) for line in f]
        return render_template('logs.html', logs=logs)
    except Exception as e:
        return str(e), 500

# Remove the test-image route as it's not needed
# Remove the serve_static route as Vercel handles static files automatically

if __name__ == '__main__':
    app.run(debug=True, port=5001) 