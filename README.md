# SPY HUNT // Social Deduction Game

Spy Hunt (inspired by Spyfall) is a tactical social deduction game for 2 to 4 players. One player is secretly assigned as the **Spy**, while the other players are **Agents**. 

Agents know the secret location and their individual roles, whereas the Spy only knows they are the Spy. The Spy's objective is to deduce the secret location or avoid detection, while the Agents' objective is to identify the Spy.

This digital version supports **Local Pass-and-Play**, **Solo play against AI**, or **Online multiplayer rooms** across devices.

---

## 🚀 Key Features

*   **Online Multiplayer (Covert Network)**: Create rooms, share a 4-letter room code, and connect multiple devices (phones, tablets, computers) on the same local network or server.
*   **Local Play (Local Mission)**: Play offline on a single device passing it around, or play solo against smart AI bots.
*   **Adaptive AI Bots**: AI Agents evaluate answers using logical criteria, raising suspicion if a player lies. The AI Spy maintains location probabilities and will dynamically attempt to guess the location if it is confident.
*   **Interactive Scratchpad**: Tappable deduction scratchpad to cross off locations as they are ruled out.
*   **Procedural Synth Audio**: Sound effects for fingerprint scanning, alerts, and timer countdowns generated programmatically using the Web Audio API.
*   **AI Neural Reasoning Log**: A detailed breakdown of the AI's internal reasoning (suspicion score adjustments and location probability matrices) is published on the debrief screen at the end of each round.

---

## 🛠️ Technology Stack

*   **Frontend**: HTML5, Vanilla CSS3 (Cyberpunk styling, CRT scanlines, 3D card flips), JavaScript (ES6).
*   **Audio**: Web Audio API (real-time programmatic sound synthesis).
*   **Backend**: Node.js, `ws` (WebSockets) for multiplayer state synchronization.

---

## 📦 Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ganeshkrishnareddy/SpyHunt.git
    cd SpyHunt
    ```

2.  **Install Backend Dependencies**:
    ```bash
    npm install
    ```

---

## 🚦 How to Run the Game

To play the online room multiplayer, you need to run **both** the WebSocket server and serve the HTML client.

### 1. Start the WebSocket Server (Port 8082)
The signaling server coordinates rooms, syncs timers, turns, accusations, and voting.
```bash
npm start
```
*(Or manually run `node server.js`)*

### 2. Host the Frontend Assets (Port 8080)
You can serve the folder using any HTTP server. For example, using `http-server`:
```bash
npx http-server -p 8080
```
Then, open **`http://localhost:8080`** in your browser.

*Note: If playing with friends on the same Wi-Fi network, open `http://<your-host-ip>:8080` on their devices. The client will automatically discover and connect to the WebSocket server at `ws://<your-host-ip>:8082`.*

---

## 🎮 Game Rules & Gameplay

### 1. Setup Phase
*   **Local Mode**: Human players take turns clicking "AUTHENTICATE BIOMETRICS" to privately view their card, then pass the device to the next player.
*   **Online Mode**: Every player connects on their own device. As soon as the host starts the game, cards are displayed privately on everyone's screen simultaneously.

### 2. Turns (Questions & Answers)
*   The active player chooses a target player and asks them a question (general or role-specific).
*   The target player responds (either selecting from logical suggestions or typing a custom text) and then gains transmission control to ask the next question.
*   *Rule*: You cannot ask a question back to the person who just asked you.

### 3. Accusations & Voting
*   Any player can click **ACCUSE OPERATIVE** at any time.
*   The game pauses, and all players cast a **GUILTY** or **INNOCENT** vote.
*   If the accused player receives a majority of **GUILTY** votes, they are executed.
    *   If they are the Spy, the **Agents Win**.
    *   If they are an Agent, the **Spy Wins**.
*   AI bots vote guilty if their suspicion of the accused player is `>= 35%`.

### 4. Spy Guessing
*   The Spy can reveal themselves at any time by clicking **GUESS LOCATION**.
*   If the Spy guesses the correct location, the **Spy Wins**. Otherwise, the **Agents Win**.
