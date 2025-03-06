class VoiceChat {
    constructor() {
        this.startBtn = document.getElementById('startBtn');
        this.status = document.querySelector('.status');
        this.messages = document.getElementById('messages');
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.synthesis = window.speechSynthesis;
        this.soundGlow = document.querySelector('.sound-glow');
        this.currentMessage = null;
        this.isSpeaking = false;
        
        this.setupRecognition();
        this.setupEventListeners();
        this.loadVoices();
        
        // Add introduction message after a short delay
        setTimeout(() => {
            const introMessage = "Hey there! I'm your AI assistant. Hold the microphone button to talk with me.";
            this.addMessage(introMessage, 'ai-message');
            this.speak(introMessage);
        }, 1000);
    }

    loadVoices() {
        // Force initialize voices
        window.speechSynthesis.getVoices();
        
        window.speechSynthesis.onvoiceschanged = () => {
            this.voices = window.speechSynthesis.getVoices();
            console.log('Available voices:', this.voices.map(v => v.name));
        };
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            
            // Fade out previous message with longer delay
            if (this.currentMessage) {
                this.currentMessage.classList.add('fade-out');
                setTimeout(() => {
                    if (this.currentMessage && this.currentMessage.parentNode) {
                        this.currentMessage.remove();
                    }
                }, 1500); // Increased from 500ms to 1500ms
            }
            
            this.addMessage(text, 'user-message');
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: text }),
                });

                const data = await response.json();
                if (data.response) {
                    // Wait longer before showing AI response
                    setTimeout(() => {
                        if (this.currentMessage) {
                            this.currentMessage.classList.add('fade-out');
                            setTimeout(() => {
                                if (this.currentMessage && this.currentMessage.parentNode) {
                                    this.currentMessage.remove();
                                }
                                this.addMessage(data.response, 'ai-message');
                                this.speak(data.response);
                            }, 1500); // Increased from 500ms to 1500ms
                        }
                    }, 300);
                }
            } catch (error) {
                console.error('Error:', error);
                const errorMsg = "Sorry, I encountered an error. Please try again.";
                this.addMessage(errorMsg, 'ai-message error');
                this.speak(errorMsg);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            this.status.textContent = 'Error: ' + event.error;
        };
    }

    setupEventListeners() {
        this.startBtn.addEventListener('mousedown', () => this.startListening());
        this.startBtn.addEventListener('mouseup', () => this.stopListening());
        this.startBtn.addEventListener('mouseleave', () => this.stopListening());
        
        // Add touch events for mobile
        this.startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startListening();
        });
        this.startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopListening();
        });
    }

    startListening() {
        try {
            this.recognition.start();
            this.status.textContent = 'Listening...';
            this.startBtn.classList.add('active');
        } catch (error) {
            console.error('Start listening error:', error);
        }
    }

    stopListening() {
        try {
            this.recognition.stop();
            this.status.textContent = 'Idle';
            this.startBtn.classList.remove('active');
        } catch (error) {
            console.error('Stop listening error:', error);
        }
    }

    addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.textContent = text;
        this.messages.appendChild(messageDiv);
        this.currentMessage = messageDiv;
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    speak(text) {
        if (!text) return;
        
        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = this.synthesis.getVoices();
        const maleVoice = voices.find(voice => 
            voice.name.includes('David') || 
            (voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en'))
        ) || voices.find(voice => voice.lang.startsWith('en-'));

        if (maleVoice) {
            utterance.voice = maleVoice;
        }

        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.status.textContent = 'Speaking';
            if (this.soundGlow) {
                this.soundGlow.classList.add('active');
            }
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.status.textContent = 'Idle';
            if (this.soundGlow) {
                this.soundGlow.classList.remove('active');
            }
        };

        this.synthesis.speak(utterance);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceChat();
}); 