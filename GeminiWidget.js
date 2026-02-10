(function () {
    let template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: "72", "72full", Arial, Helvetica, sans-serif;
            }
            .chat-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: #fff;
                box-sizing: border-box;
            }
            .chat-header {
                background-color: #354a5f;
                color: #fff;
                padding: 10px;
                font-weight: bold;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
            }
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background-color: #f7f7f7;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .message {
                max-width: 80%;
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            .message.user {
                align-self: flex-end;
                background-color: #e5f4ff;
                color: #000;
                border-bottom-right-radius: 2px;
            }
            .message.ai {
                align-self: flex-start;
                background-color: #fff;
                border: 1px solid #ddd;
                border-bottom-left-radius: 2px;
            }
            .message.error {
                align-self: center;
                background-color: #ffe5e5;
                color: #d00;
                font-size: 12px;
            }
            .chat-input-area {
                display: flex;
                padding: 10px;
                border-top: 1px solid #ccc;
                background: #fff;
                border-bottom-left-radius: 4px;
                border-bottom-right-radius: 4px;
            }
            input[type="text"] {
                flex: 1;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                margin-right: 8px;
                outline: none;
            }
            input[type="text"]:focus {
                border-color: #0070f2;
            }
            button {
                padding: 8px 16px;
                background-color: #0070f2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background-color: #005eb8;
            }
            button:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            /* Markdown styling for AI response */
            .message.ai strong { font-weight: bold; }
            .message.ai code { background: #eee; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
            .message.ai pre { background: #eee; padding: 5px; border-radius: 5px; overflow-x: auto; }
        </style>
        <div class="chat-container">
            <div class="chat-header" id="header">Gemini AI</div>
            <div class="chat-messages" id="messages"></div>
            <div class="chat-input-area">
                <input type="text" id="userInput" placeholder="Type your message..." />
                <button id="sendBtn">Send</button>
            </div>
        </div>
    `;

    class GeminiWidget extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));

            // Default Properties
            this._apiKey = "";
            this._model = "gemini-2.5-flash"; // Stabilny model Google
            this._welcomeMsg = "Hello! I am Gemini. How can I help you?";
            this._temperature = 0.7;
            this._maxTokens = 1000;
            this._headerLabel = "Gemini AI";
            this._btnLabel = "Send";
            this._inputHint = "Type your message...";
            this._contextData = "";

            // UI Elements
            this.$messages = this._shadowRoot.getElementById("messages");
            this.$input = this._shadowRoot.getElementById("userInput");
            this.$btn = this._shadowRoot.getElementById("sendBtn");
            this.$header = this._shadowRoot.getElementById("header");

            // Bind Events
            this.$btn.addEventListener("click", this._sendMessage.bind(this));
            this.$input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this._sendMessage();
            });
        }

        // --- Metody SAP Analytics Cloud (Gettery/Settery) ---
        // Muszą pasować do nazw w pliku JSON

        set apiKey(value) { this._apiKey = value; }
        get apiKey() { return this._apiKey; }

        set model(value) { this._model = value; }
        get model() { return this._model; }

        set welcomeMsg(value) {
            this._welcomeMsg = value;
            this._renderWelcomeMessage();
        }
        get welcomeMsg() { return this._welcomeMsg; }

        set temperature(value) { this._temperature = value; }
        get temperature() { return this._temperature; }

        set maxTokens(value) { this._maxTokens = value; }
        get maxTokens() { return this._maxTokens; }

        set headerLabel(value) {
            this._headerLabel = value;
            if (this.$header) this.$header.innerText = value;
        }
        get headerLabel() { return this._headerLabel; }

        set btnLabel(value) {
            this._btnLabel = value;
            if (this.$btn) this.$btn.innerText = value;
        }
        get btnLabel() { return this._btnLabel; }

        set inputHint(value) {
            this._inputHint = value;
            if (this.$input) this.$input.placeholder = value;
        }
        get inputHint() { return this._inputHint; }

        set contextData(value) { this._contextData = value || ""; }
        get contextData() { return this._contextData; }

        // Puste settery dla kompatybilności (gdyby JSON miał stare pola)
        set chatBoxHeight(v) {} 
        set serverTimeOut(v) {}
        set completionChoices(v) {}
        set notificationToggle(v) {}
        set settingsToggle(v) {}

        // --- Logika Widgetu ---

        onCustomWidgetAfterUpdate(changedProperties) {
            if ("welcomeMsg" in changedProperties) {
                this._renderWelcomeMessage();
            }
            if ("headerLabel" in changedProperties) {
                this.$header.innerText = changedProperties["headerLabel"];
            }
        }

        _renderWelcomeMessage() {
            // Wyczyść czat i dodaj wiadomość powitalną tylko jeśli lista jest pusta
            if (this.$messages.children.length === 0 && this._welcomeMsg) {
                this._appendMessage(this._welcomeMsg, "ai");
            }
        }

        _appendMessage(text, sender) {
            const div = document.createElement("div");
            div.classList.add("message", sender);
            
            // Proste formatowanie nowych linii dla AI
            if (sender === "ai") {
                // Zamiana nowych linii na <br> dla czytelności
                div.innerHTML = text.replace(/\n/g, "<br>"); 
            } else {
                div.textContent = text;
            }

            this.$messages.appendChild(div);
            this.$messages.scrollTop = this.$messages.scrollHeight;
        }

        async _sendMessage() {
            const text = this.$input.value.trim();
            if (!text) return;
            if (!this._apiKey) {
                this._appendMessage("Error: API Key is missing. Please configure it in the widget settings.", "error");
                return;
            }

            // 1. Pokaż wiadomość użytkownika
            this._appendMessage(text, "user");
            this.$input.value = "";
            this.$input.disabled = true;
            this.$btn.disabled = true;
            this.$btn.innerText = "...";

            try {
                // 2. Wywołanie Google Gemini API z retry logic
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${this._model}:generateContent?key=${this._apiKey}`;

                const parts = [];
                if (this._contextData) {
                    parts.push({ text: `Kontekst danych:\n${this._contextData}` });
                }
                parts.push({ text: text });

                const payload = {
                    contents: [{
                        parts
                    }],
                    generationConfig: {
                        temperature: this._temperature,
                        maxOutputTokens: this._maxTokens
                    }
                };

                let response;
                let retries = 0;
                const maxRetries = 3;

                while (retries <= maxRetries) {
                    try {
                        response = await fetch(url, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        // Retry przy 429 Too Many Requests
                        if (response.status === 429 && retries < maxRetries) {
                            const waitTime = Math.pow(2, retries) * 2000; // 2s, 4s, 8s
                            console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                            retries++;
                            continue;
                        }

                        break;
                    } catch (fetchErr) {
                        if (retries < maxRetries) {
                            retries++;
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                        }
                        throw fetchErr;
                    }
                }

                // Fallback na stabilny model przy 404
                if (response.status === 404 && this._model.endsWith("-latest")) {
                    this._model = "gemini-2.5-flash";
                    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this._model}:generateContent?key=${this._apiKey}`;
                    response = await fetch(fallbackUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                }

                if (!response.ok) {
                    let errText = `${response.status} ${response.statusText}`;
                    let errBody = null;
                    let errRaw = null;

                    try {
                        errBody = await response.json();
                        if (errBody?.error?.message) errText = errBody.error.message;
                    } catch (_) {
                        try {
                            errRaw = await response.text();
                            if (errRaw) errText = `${errText} | ${errRaw}`;
                        } catch (_) {}
                    }

                    console.error("Gemini API error", {
                        status: response.status,
                        statusText: response.statusText,
                        model: this._model,
                        url,
                        errorBody: errBody,
                        errorRaw: errRaw
                    });

                    throw new Error(`API Error: ${errText}`);
                }

                const data = await response.json();
                
                // 3. Wyciągnięcie odpowiedzi
                // Struktura Gemini: candidates[0].content.parts[0].text
                if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                    const reply = data.candidates[0].content.parts[0].text;
                    this._appendMessage(reply, "ai");
                } else {
                    this._appendMessage("No content returned from Gemini.", "error");
                }

            } catch (error) {
                console.error(error);
                this._appendMessage("Error: " + error.message, "error");
            } finally {
                this.$input.disabled = false;
                this.$btn.disabled = false;
                this.$btn.innerText = this._btnLabel;
                this.$input.focus();
            }
        }
    }

    // Rejestracja WebComponentu (musi pasować do pola "tag" w sekcji main JSON-a)
    const mainTag = "com-kocu-sap-gemini";

    if (!customElements.get(mainTag)) {
        customElements.define(mainTag, GeminiWidget);
    }
})();
