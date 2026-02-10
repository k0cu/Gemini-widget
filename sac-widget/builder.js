(function () {
    const template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host { font-family: Arial, sans-serif; display: block; }
            form { padding: 10px; }
            label { display: block; margin: 8px 0 4px; font-size: 12px; color: #333; }
            input, textarea { width: 100%; padding: 6px 8px; box-sizing: border-box; }
            button { margin-top: 10px; padding: 8px 12px; background: #0070f2; color: #fff; border: 0; border-radius: 4px; cursor: pointer; }
        </style>
        <form id="form">
            <label>API Key</label>
            <input id="apiKey" type="text" />

            <label>Model</label>
            <input id="model" type="text" />

            <label>Welcome Message</label>
            <textarea id="welcomeMsg" rows="3"></textarea>

            <label>Header Label</label>
            <input id="headerLabel" type="text" />

            <label>Button Label</label>
            <input id="btnLabel" type="text" />

            <label>Input Hint</label>
            <input id="inputHint" type="text" />

            <label>Temperature</label>
            <input id="temperature" type="number" step="0.1" min="0" max="2" />

            <label>Max Tokens</label>
            <input id="maxTokens" type="number" min="1" />

            <button type="submit">Update</button>
        </form>
    `;

    class GeminiWidgetBuilder extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));
            this._shadowRoot.getElementById("form").addEventListener("submit", this._submit.bind(this));
        }

        _submit(e) {
            e.preventDefault();
            this.dispatchEvent(
                new CustomEvent("propertiesChanged", {
                    detail: {
                        properties: {
                            apiKey: this.apiKey,
                            model: this.model,
                            welcomeMsg: this.welcomeMsg,
                            headerLabel: this.headerLabel,
                            btnLabel: this.btnLabel,
                            inputHint: this.inputHint,
                            temperature: this.temperature,
                            maxTokens: this.maxTokens
                        }
                    }
                })
            );
        }

        set apiKey(v) { this._shadowRoot.getElementById("apiKey").value = v || ""; }
        get apiKey() { return this._shadowRoot.getElementById("apiKey").value; }

        set model(v) { this._shadowRoot.getElementById("model").value = v || ""; }
        get model() { return this._shadowRoot.getElementById("model").value; }

        set welcomeMsg(v) { this._shadowRoot.getElementById("welcomeMsg").value = v || ""; }
        get welcomeMsg() { return this._shadowRoot.getElementById("welcomeMsg").value; }

        set headerLabel(v) { this._shadowRoot.getElementById("headerLabel").value = v || ""; }
        get headerLabel() { return this._shadowRoot.getElementById("headerLabel").value; }

        set btnLabel(v) { this._shadowRoot.getElementById("btnLabel").value = v || ""; }
        get btnLabel() { return this._shadowRoot.getElementById("btnLabel").value; }

        set inputHint(v) { this._shadowRoot.getElementById("inputHint").value = v || ""; }
        get inputHint() { return this._shadowRoot.getElementById("inputHint").value; }

        set temperature(v) { this._shadowRoot.getElementById("temperature").value = v ?? 0.7; }
        get temperature() { return parseFloat(this._shadowRoot.getElementById("temperature").value || "0.7"); }

        set maxTokens(v) { this._shadowRoot.getElementById("maxTokens").value = v ?? 1000; }
        get maxTokens() { return parseInt(this._shadowRoot.getElementById("maxTokens").value || "1000", 10); }
    }

    customElements.define("com-kocu-sap-gemini-builder", GeminiWidgetBuilder);
})();
