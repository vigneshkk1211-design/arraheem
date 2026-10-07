# 🤖 Production-Ready Hybrid WhatsApp AI Chatbot

A production-grade, privacy-first **Hybrid WhatsApp AI Chatbot** powered by **Node.js**, **whatsapp-web.js**, and local **Ollama (Llama 3.2)**. 

Designed for businesses using a **single phone number**, this bot allows an owner or support team to seamlessly alternate between **AI Auto-Replies** and **Manual Human Conversations** without interruption or conflict.

---

## 🌟 Key Features

- 🧠 **Local & Private AI**: Runs locally using **Ollama** and Meta's **Llama 3.2** model. Zero per-token API costs and total data privacy.
- 🔄 **Hybrid Dual-Mode (Manual Toggle)**:
  - Operate from a **single WhatsApp business number**.
  - Business owner types `!off` or `pause` directly inside any customer chat to take over manually.
  - Type `!on` or `resume` to return the chat to AI auto-reply.
- 👤 **Instant Customer Handover**:
  - Customers can type `human`, `agent`, or `1` at any time.
  - The bot acknowledges the customer, immediately pauses AI for that chat, and triggers high-visibility alerts (console banner and optional WhatsApp notification to the admin's personal phone).
- 🔐 **Persistent Authentication (LocalAuth)**:
  - Scan the terminal QR code **only once**.
  - Chromium sessions are saved in `.wwebjs_auth/` so the bot restarts automatically without re-authenticating.
- 💾 **Persistent Chat State**:
  - Tracks active and paused chats in `chat_states.json`.
  - Paused customer chats remain safely paused even if the server restarts.
- 🛡️ **Smart Message Filtering**:
  - Strictly ignores WhatsApp groups (`@g.us`), status updates (`status@broadcast`), and broadcast channels (`@newsletter`).
  - Only processes direct 1-to-1 consumer messages (`@c.us`).
- 💬 **WhatsApp Typing Simulation**:
  - Automatically simulates the WhatsApp "typing..." state while Ollama generates the response.

---

## 📁 Project Structure

```text
client_chatbot/
├── .env                  # Configuration variables (Ollama URL, model name, etc.)
├── .env.example          # Template configuration
├── .gitignore            # Git exclusion rules (.wwebjs_auth, node_modules, etc.)
├── index.js              # Core application logic, event handlers & state manager
├── package.json          # Dependencies and npm scripts
├── chat_states.json      # Auto-generated runtime state persistence file
└── README.md             # Complete documentation and setup guide
```

---

## 🛠️ Prerequisites

1. **Node.js**: Version 18.x or newer (Tested on Node v20+ / v26).
2. **Ollama**: Installed and running locally.
   - Download: [https://ollama.com](https://ollama.com)
   - Pull the Llama 3.2 model:
     ```bash
     ollama run llama3.2
     ```
3. **WhatsApp Account**: A phone with WhatsApp or WhatsApp Business installed.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the following command inside the project directory:
```bash
npm install
```

### 2. Configure Environment (`.env`)
A default `.env` file is included. Adjust it to match your preferences:
```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
MODEL_NAME=llama3.2
OLLAMA_TIMEOUT_MS=45000

# Business Persona
BUSINESS_NAME=SmartAssist Solutions
SYSTEM_PROMPT="You are a helpful, professional, and courteous customer support assistant for SmartAssist Solutions on WhatsApp. Keep your responses concise, friendly, and formatted cleanly for mobile chat. If a user asks complex technical questions or explicitly requests a human agent, politely let them know they can type 'agent' or 'human' at any time."

# Optional: Dedicated Admin Alert Phone (Country code + digits only, e.g. 15551234567)
ADMIN_PHONE=

# Whether to send an in-chat confirmation when admin toggles AI
SEND_TOGGLE_FEEDBACK=true
```

### 3. Ensure Ollama Is Running
Verify that Ollama is serving requests:
```bash
ollama list
```
Make sure `llama3.2` appears in the list. If not, run:
```bash
ollama run llama3.2
```

### 4. Start the Chatbot
```bash
npm start
```
*(Or use `npm run dev` to run with Node's automatic file watcher)*

---

## 📱 WhatsApp QR Code Pairing

1. When you run `npm start` for the first time, an ASCII QR code will appear in your terminal.
2. Open **WhatsApp** on your phone:
   - **Android**: Tap the three dots `⋮` in the top right > **Linked Devices** > **Link a Device**.
   - **iPhone**: Go to **Settings** > **Linked Devices** > **Link a Device**.
3. Scan the terminal QR code.
4. Once authenticated, you will see:
   ```text
   [AUTH] Authentication successful! Local session saved.
   [READY] WhatsApp AI Bot is active and listening!
   ```
5. **No need to scan again!** Future restarts load your session from `.wwebjs_auth/`.

---

## 🕹️ How It Works: Commands & Workflow

### 1. Normal AI Auto-Reply
When a customer sends a message:
- The bot displays "typing..." in WhatsApp.
- It queries local Ollama (`llama3.2`).
- Sends the AI reply and maintains conversational context.

---

### 2. Customer Handover Request
If a customer types any of the following:
- `human`
- `agent`
- `1`
- `support`
- `talk to human`

**What happens:**
1. The bot automatically replies to the customer:
   > 👤 *Representative Requested*  
   > *You have requested a human representative. Our team has been notified, and an agent will join this conversation shortly.*  
   > *(AI auto-reply is currently paused for this chat.)*
2. AI auto-reply is **paused** for that specific customer chat.
3. A highlighted alert banner appears in the server console:
   ```text
   ============================================================
   🚨 [CUSTOMER HANDOVER ALERT]
   Customer:  +15550199 (John Doe)
   Trigger:   "agent"
   Status:    AI is now PAUSED for this chat.
   Action:    Please reply to customer manually.
   Resume:    Type '!on' or 'resume' in their chat when finished.
   ============================================================
   ```
4. If `ADMIN_PHONE` is specified in `.env`, the admin receives an automated WhatsApp alert message.

---

### 3. Single-Number Admin Manual Takeover (In-Chat Toggle)
Because the business uses a **single WhatsApp account**, the business owner can open the customer's chat on their mobile app or WhatsApp Web and type commands directly:

| Command | Action |
| :--- | :--- |
| `!off` or `pause` | **Turns OFF AI** for this chat. You can now chat manually with the customer without the bot replying. |
| `!on` or `resume` | **Turns ON AI** for this chat. Resumes automated AI replies. |
| `!status` | Checks current mode (`ACTIVE` vs `PAUSED`) and handover reason. |
| `!reset` | Clears conversation memory for this chat for a fresh start. |
| `!help` | Displays the admin command cheat sheet. |

> **Note**: Ordinary messages typed by the business owner to the customer are automatically ignored by the bot, allowing completely natural conversations.

---

### 4. Remote Admin Toggles (Bonus)
The admin can also control customer chats from any admin chat by specifying the phone number:
- `!off 15550199` — Pauses AI for customer `+15550199`.
- `!on 15550199` — Resumes AI for customer `+15550199`.

---

## ⚙️ Configuration Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `OLLAMA_URL` | `http://localhost:11434` | Base URL of local or remote Ollama server |
| `MODEL_NAME` | `llama3.2` | Ollama model name (e.g., `llama3.2`, `llama3.1:8b`) |
| `OLLAMA_TIMEOUT_MS` | `45000` | Timeout in milliseconds for Ollama response generation |
| `BUSINESS_NAME` | `SmartAssist Solutions` | Name of your business used in prompts |
| `SYSTEM_PROMPT` | Custom prompt | System instructions defining persona and constraints |
| `ADMIN_PHONE` | *(empty)* | Optional phone number to receive handover WhatsApp alerts |
| `SEND_TOGGLE_FEEDBACK`| `true` | Send confirmation message into chat upon toggle |
| `SESSION_PATH` | `./.wwebjs_auth` | Directory where WhatsApp credentials are persisted |
| `STATE_FILE_PATH` | `./chat_states.json` | Path to persistent chat state JSON file |
| `CHROME_PATH` | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Local machine's Google Chrome executable path |


---

## ❓ Troubleshooting & FAQs

### Q: Ollama connection fails or gives timeout
- Ensure Ollama is running:
  ```bash
  ollama list
  ```
- Test connectivity:
  ```bash
  curl http://localhost:11434/api/tags
  ```
- If on Windows, ensure Ollama is not blocked by Windows Defender Firewall for local loopback connections.

### Q: How do I re-link or scan with a different WhatsApp account?
Delete the session directory and restart the bot:
```bash
rmdir /s /q .wwebjs_auth
npm start
```

### Q: Puppeteer fails to launch on Linux / VPS
Install missing Chromium sandbox dependencies:
```bash
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon-x11-0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2
```

---

## 📄 License
ISC License. Open-source and free to customize for commercial or personal business use.
