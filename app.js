/* ==========================================
   SPY HUNT: CORE GAMEPLAY & AI ENGINE (app.js)
   ========================================== */

// 1. DATABASE: LOCATIONS & ATTRIBUTES
const LOCATIONS = [
  {
    id: "submarine",
    name: "Submarine",
    attributes: { noise: "loud", dress: "uniform", danger: "high", windows: "no", temp: "normal", type: "indoor" },
    roles: ["Captain", "Sonar Operator", "Chief Engineer", "Cook"]
  },
  {
    id: "space_station",
    name: "Space Station",
    attributes: { noise: "quiet", dress: "uniform", danger: "high", windows: "yes", temp: "normal", type: "indoor" },
    roles: ["Astronaut", "Scientist", "Space Tourist", "Repair Drone"]
  },
  {
    id: "casino",
    name: "Casino",
    attributes: { noise: "loud", dress: "formal", danger: "low", windows: "no", temp: "normal", type: "indoor" },
    roles: ["Dealer", "High Roller", "Security Guard", "Bartender"]
  },
  {
    id: "pirate_ship",
    name: "Pirate Ship",
    attributes: { noise: "loud", dress: "casual", danger: "high", windows: "no", temp: "warm", type: "outdoor" },
    roles: ["Captain", "Lookout", "Cabin Boy", "Deckhand"]
  },
  {
    id: "hospital",
    name: "Hospital",
    attributes: { noise: "quiet", dress: "uniform", danger: "low", windows: "yes", temp: "normal", type: "indoor" },
    roles: ["Doctor", "Nurse", "Surgeon", "Patient"]
  },
  {
    id: "amusement_park",
    name: "Amusement Park",
    attributes: { noise: "loud", dress: "casual", danger: "low", windows: "yes", temp: "warm", type: "outdoor" },
    roles: ["Mascot", "Ride Operator", "Ticket Seller", "Visitor"]
  },
  {
    id: "school",
    name: "School",
    attributes: { noise: "moderate", dress: "casual", danger: "low", windows: "yes", temp: "normal", type: "indoor" },
    roles: ["Teacher", "Principal", "Student", "Janitor"]
  },
  {
    id: "airport",
    name: "Airport",
    attributes: { noise: "loud", dress: "casual", danger: "low", windows: "yes", temp: "normal", type: "indoor" },
    roles: ["Pilot", "Flight Attendant", "Passenger", "Security Officer"]
  },
  {
    id: "movie_studio",
    name: "Movie Studio",
    attributes: { noise: "quiet", dress: "casual", danger: "low", windows: "no", temp: "normal", type: "indoor" },
    roles: ["Director", "Actor", "Camera Operator", "Makeup Artist"]
  },
  {
    id: "supermarket",
    name: "Supermarket",
    attributes: { noise: "moderate", dress: "casual", danger: "low", windows: "yes", temp: "cold", type: "indoor" },
    roles: ["Cashier", "Stocker", "Customer", "Butcher"]
  }
];

// 2. DATABASE: QUESTIONS & LOGICAL ANSWERS
const QUESTIONS = [
  {
    id: "noise",
    text: "How is the noise level here?",
    attribute: "noise",
    answers: {
      loud: [
        "It's extremely loud with machinery or crowds.",
        "Very noisy, you have to raise your voice to be heard.",
        "Lots of background noise, it's quite deafening."
      ],
      moderate: [
        "It's a moderate noise level, some hum and chatter.",
        "Normal ambient sounds, nothing too loud.",
        "A typical amount of noise, pretty standard."
      ],
      quiet: [
        "It's relatively quiet and peaceful here.",
        "Very quiet, you can hear whispers clearly.",
        "Almost silent, save for a few soft sounds."
      ]
    }
  },
  {
    id: "dress",
    text: "What kind of clothing are we wearing?",
    attribute: "dress",
    answers: {
      uniform: [
        "We are wearing specialized uniforms.",
        "Everyone is in official dress or matching gear.",
        "Professional uniforms, standard for our roles."
      ],
      formal: [
        "It's a formal dress code, quite elegant.",
        "Fancy suits, dresses, or high-end clothing.",
        "Very smart attire, dress to impress."
      ],
      casual: [
        "Everyone is dressed in casual, everyday clothes.",
        "Normal, relaxed wear, nothing formal.",
        "Just regular comfortable clothes."
      ]
    }
  },
  {
    id: "danger",
    text: "Is this environment dangerous?",
    attribute: "danger",
    answers: {
      high: [
        "Yes, one slip-up here could be fatal.",
        "Extremely hazardous, safety protocols are key.",
        "It feels like we're constantly on the edge of danger."
      ],
      low: [
        "No, it's a very safe, controlled environment.",
        "Completely safe, no real danger here.",
        "Very secure, danger is the last thing on my mind."
      ]
    }
  },
  {
    id: "windows",
    text: "Are there windows to the outside?",
    attribute: "windows",
    answers: {
      yes: [
        "Yes, there are windows with a view of the outside.",
        "We have clear window panes looking out.",
        "Yes, you can see what's happening outside."
      ],
      no: [
        "No windows here, we are completely enclosed.",
        "No glass views, it's fully indoor/walled off.",
        "We are cut off from any outside view."
      ]
    }
  },
  {
    id: "temp",
    text: "How does the temperature feel?",
    attribute: "temp",
    answers: {
      normal: [
        "It's a comfortable, climate-controlled temperature.",
        "Feels completely normal and pleasant.",
        "Standard temperature, not too hot or cold."
      ],
      warm: [
        "It's quite warm/hot here.",
        "A bit sweaty, the heat is noticeable.",
        "Warm air, definitely not chilly."
      ],
      cold: [
        "It's quite cold/chilly here.",
        "Freezing! I wish I had brought a heavier coat.",
        "Chilled air, definitely on the cold side."
      ]
    }
  },
  {
    id: "type",
    text: "Are we indoors or outdoors?",
    attribute: "type",
    answers: {
      indoor: [
        "We are definitely indoors.",
        "Under a roof, safe from the elements.",
        "Inside a structure, no open sky directly above."
      ],
      outdoor: [
        "We are outdoors in the open air.",
        "Exposed to the sky and weather.",
        "Outdoors, feeling the natural atmosphere."
      ]
    }
  }
];

// SPY VAGUE ANSWERS (used when Spy AI doesn't know location)
const SPY_VAGUE_ANSWERS = [
  "It's pretty standard, nothing out of the ordinary.",
  "I'm just focused on my duties, haven't paid much attention.",
  "Everything feels normal for this kind of place.",
  "It's comfortable enough for what I need to do.",
  "Pretty typical, exactly what you would expect."
];

// AI NAMES DATABASE
const AI_NAMES = ["Agent Helix", "Cipher", "Spectre", "Shadow", "Wasp", "Oracle", "Apex", "Ghost"];

// 3. AUDIO ENGINE (Web Audio API)
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
      document.getElementById("audio-prompt").classList.add("hidden");
      this.playBeep(600, 0.1);
    } catch (e) {
      console.warn("Failed to initialize Web Audio:", e);
    }
  }

  playBeep(freq = 440, duration = 0.1, type = "sine", volume = 0.1) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playReveal() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.6);
  }

  playAlert() {
    this.playBeep(880, 0.08, "square", 0.06);
    setTimeout(() => this.playBeep(1200, 0.1, "square", 0.06), 80);
  }

  playAlarm() {
    this.playBeep(330, 0.15, "triangle", 0.15);
    setTimeout(() => this.playBeep(290, 0.15, "triangle", 0.15), 180);
  }

  playWin() {
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.3, "sine", 0.08);
      }, idx * 150);
    });
  }

  playLose() {
    if (!this.enabled || !this.ctx) return;
    const notes = [220.00, 196.00, 164.81, 130.81]; // A3, G3, E3, C3
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.4, "sine", 0.1);
      }, idx * 200);
    });
  }

  playType() {
    this.playBeep(1600, 0.015, "sine", 0.015);
  }

  playTick() {
    this.playBeep(240, 0.03, "triangle", 0.08);
  }
}

const sfx = new AudioEngine();

// 4. GAME STATE
const state = {
  // Offline settings
  totalPlayers: 4,
  humanPlayers: 1,
  timerDuration: 180, 
  timerRemaining: 0,
  timerInterval: null,
  
  players: [],
  secretLocation: null,
  spyPlayer: null,
  
  activePlayerIdx: 0, 
  lastQuestionTargetIdx: null, 
  scratchpadCrossed: new Set(),
  
  gamePhase: "setup", // setup, reveal, gameplay, voting, gameover
  revealPlayerIdx: 0,
  
  // Voting phase state
  voteAccuser: null,
  voteAccused: null,
  votesCast: {}, 
  
  // Custom tracking for AI reasoning logs
  aiReasoningLogs: [],
  startTime: 0,

  // ONLINE EXTENSIONS STATE
  isOnline: false,
  roomCode: null,
  playerId: null, // local player index in the lobby
  isHost: false,
  socket: null,
  onlinePlayers: []
};

// 5. DOM ELEMENTS
const DOM = {
  viewSetup: document.getElementById("view-setup"),
  viewReveal: document.getElementById("view-reveal"),
  viewGameplay: document.getElementById("view-gameplay"),
  viewGameOver: document.getElementById("view-gameover"),
  
  btnRules: document.getElementById("btn-rules"),
  modalRules: document.getElementById("modal-rules"),
  btnCloseRules: document.getElementById("btn-close-rules"),
  
  // Offline Setup inputs
  setupRadio2: document.getElementById("players-2"),
  setupRadio3: document.getElementById("players-3"),
  setupRadio4: document.getElementById("players-4"),
  humanSelection: document.getElementById("human-selection"),
  selectTimer: document.getElementById("select-timer"),
  playerNamesContainer: document.getElementById("player-names-container"),
  btnStartGame: document.getElementById("btn-start-game"),

  // Online Setup elements
  tabLocal: document.getElementById("tab-local"),
  tabOnline: document.getElementById("tab-online"),
  setupLocalArea: document.getElementById("setup-local-area"),
  setupOnlineArea: document.getElementById("setup-online-area"),
  
  onlinePrelobbyView: document.getElementById("online-prelobby-view"),
  inputOnlineName: document.getElementById("input-online-name"),
  btnCreateLobbyTrigger: document.getElementById("btn-create-lobby-trigger"),
  btnJoinLobbyTrigger: document.getElementById("btn-join-lobby-trigger"),
  onlineConnStatus: document.getElementById("online-conn-status"),
  onlineJoinFields: document.getElementById("online-join-fields"),
  inputRoomCode: document.getElementById("input-room-code"),
  btnConnectRoom: document.getElementById("btn-connect-room"),
  btnBackToPrelobby: document.getElementById("btn-back-to-prelobby"),

  onlineLobbyView: document.getElementById("online-lobby-view"),
  lobbyCodeDisplay: document.getElementById("lobby-code-display"),
  lobbySettingsControls: document.getElementById("lobby-settings-controls"),
  onlineRadio2: document.getElementById("online-players-2"),
  onlineRadio3: document.getElementById("online-players-3"),
  onlineRadio4: document.getElementById("online-players-4"),
  onlineSelectTimer: document.getElementById("online-select-timer"),
  lobbyGuestMessage: document.getElementById("lobby-guest-message"),
  onlineLobbyPlayers: document.getElementById("online-lobby-players"),
  btnDisconnectLobby: document.getElementById("btn-disconnect-lobby"),
  btnStartOnlineGame: document.getElementById("btn-start-online-game"),
  
  // Reveal elements
  revealPlayerName: document.getElementById("reveal-player-name"),
  idCard: document.getElementById("id-card"),
  btnRevealCard: document.getElementById("btn-reveal-card"),
  cardStatusTitle: document.getElementById("card-status-title"),
  cardIdentityBox: document.getElementById("card-identity-box"),
  cardLocationsList: document.getElementById("card-locations-list"),
  btnMemorized: document.getElementById("btn-memorized"),
  
  // Gameplay console
  gameTimer: document.getElementById("game-timer"),
  activePlayerDisplay: document.getElementById("active-player-display"),
  terminalLog: document.getElementById("terminal-log"),
  scratchpadLocations: document.getElementById("scratchpad-locations"),
  consoleActionArea: document.getElementById("console-action-area"),
  btnAccuseGlobal: document.getElementById("btn-accuse-global"),
  btnGuessGlobal: document.getElementById("btn-guess-global"),
  
  // Voting modal
  modalVote: document.getElementById("modal-vote"),
  voteAccuserName: document.getElementById("vote-accuser-name"),
  voteAccusedName: document.getElementById("vote-accused-name"),
  votingPlayersStatus: document.getElementById("voting-players-status"),
  humanVotingControls: document.getElementById("human-voting-controls"),
  votingHumanName: document.getElementById("voting-human-name"),
  btnVoteGuilty: document.getElementById("btn-vote-guilty"),
  btnVoteInnocent: document.getElementById("btn-vote-innocent"),
  
  // Spy Guess modal
  modalGuess: document.getElementById("modal-guess"),
  spyGuessList: document.getElementById("spy-guess-list"),
  btnCancelGuess: document.getElementById("btn-cancel-guess"),
  
  // Debriefing screen
  gameoverOutcome: document.getElementById("gameover-outcome"),
  debriefLocation: document.getElementById("debrief-location"),
  debriefSpy: document.getElementById("debrief-spy"),
  debriefTime: document.getElementById("debrief-time"),
  debriefWinReason: document.getElementById("debrief-win-reason"),
  debriefPlayersList: document.getElementById("debrief-players-list"),
  aiLogsContent: document.getElementById("ai-logs-content"),
  btnRestart: document.getElementById("btn-restart"),
  
  btnEnableAudio: document.getElementById("btn-enable-audio")
};

// 6. INITIALIZATION & SETUP SCREEN LOGIC
function init() {
  // Check if AudioContext needs user interaction first
  setTimeout(() => {
    if (!sfx.enabled) {
      DOM.btnEnableAudio.parentElement.classList.remove("hidden");
    }
  }, 1000);

  // Auto-authorize audio context on first click anywhere
  window.addEventListener("click", () => {
    sfx.init();
  }, { once: true });

  // Play a neat click sound on generic button interactions
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) {
      const customSoundButtons = [
        "btn-start-game", "btn-restart", "btn-accuse-global", 
        "btn-guess-global", "btn-create-lobby-trigger", "btn-connect-room",
        "btn-disconnect-lobby", "btn-start-online-game", "btn-reveal-card", "btn-memorized"
      ];
      if (!customSoundButtons.includes(btn.id) && 
          !btn.classList.contains("ans-select-btn") &&
          !btn.classList.contains("target-select-btn") &&
          !btn.classList.contains("question-select-btn") &&
          !btn.classList.contains("online-accuse-btn") &&
          !btn.classList.contains("online-guess-btn") &&
          !btn.classList.contains("accuse-target-btn") &&
          !btn.classList.contains("local-guess-btn") &&
          !btn.classList.contains("vote-buttons")
         ) {
        sfx.playBeep(600, 0.05, "sine", 0.05);
      }
    }
  });

  // Set up listeners for player configuration
  const handlePlayerCountChange = () => {
    const total = parseInt(document.querySelector('input[name="total-players"]:checked').value);
    state.totalPlayers = total;
    
    let humanHTML = "";
    for (let i = 1; i <= total; i++) {
      const checked = (i === 1) ? "checked" : "";
      humanHTML += `
        <input type="radio" id="human-${i}" name="human-players" value="${i}" ${checked}>
        <label for="human-${i}">${i}</label>
      `;
    }
    DOM.humanSelection.innerHTML = humanHTML;
    
    document.querySelectorAll('input[name="human-players"]').forEach(rad => {
      rad.addEventListener("change", handleHumanCountChange);
    });

    handleHumanCountChange();
  };

  const handleHumanCountChange = () => {
    const selectedRadio = document.querySelector('input[name="human-players"]:checked');
    state.humanPlayers = selectedRadio ? parseInt(selectedRadio.value) : 1;
    
    let namesHTML = "";
    for (let i = 0; i < state.totalPlayers; i++) {
      const isHuman = i < state.humanPlayers;
      const typeBadge = isHuman 
        ? `<span class="badge badge-human font-mono">HUMAN</span>`
        : `<span class="badge badge-ai font-mono">AI_BOT</span>`;
      
      const defaultName = isHuman ? `Operative ${i + 1}` : AI_NAMES[i % AI_NAMES.length];
      const disabledAttr = isHuman ? "" : "disabled";
      
      namesHTML += `
        <div class="player-input-row font-mono">
          <span>P${i+1}</span>
          <input type="text" id="player-name-${i}" value="${defaultName}" placeholder="Enter Name..." maxLength="15" ${disabledAttr}>
          ${typeBadge}
        </div>
      `;
    }
    DOM.playerNamesContainer.innerHTML = namesHTML;
  };

  // Switch Offline/Online modes via Tabs
  DOM.tabLocal.addEventListener("click", () => {
    sfx.playBeep(450, 0.08);
    state.isOnline = false;
    DOM.tabLocal.classList.add("active");
    DOM.tabOnline.classList.remove("active");
    DOM.setupLocalArea.classList.remove("hidden");
    DOM.setupOnlineArea.classList.add("hidden");
  });

  DOM.tabOnline.addEventListener("click", () => {
    sfx.playBeep(450, 0.08);
    state.isOnline = true;
    DOM.tabOnline.classList.add("active");
    DOM.tabLocal.classList.remove("active");
    DOM.setupOnlineArea.classList.remove("hidden");
    DOM.setupLocalArea.classList.add("hidden");
  });

  document.querySelectorAll('input[name="total-players"]').forEach(rad => {
    rad.addEventListener("change", handlePlayerCountChange);
  });

  handlePlayerCountChange(); // Initial generation

  // Offline Buttons
  DOM.btnStartGame.addEventListener("click", () => {
    sfx.init();
    sfx.playBeep(440, 0.1);
    setupLocalMission();
  });

  DOM.btnEnableAudio.addEventListener("click", () => sfx.init());
  DOM.btnRules.addEventListener("click", () => DOM.modalRules.classList.remove("hidden"));
  DOM.btnCloseRules.addEventListener("click", () => DOM.modalRules.classList.add("hidden"));
  
  DOM.btnRestart.addEventListener("click", () => {
    sfx.playBeep(400, 0.1);
    if (state.isOnline) {
      disconnectWebSocket();
    }
    switchView("setup");
  });

  DOM.btnAccuseGlobal.addEventListener("click", () => {
    sfx.playBeep(500, 0.1);
    if (state.isOnline) {
      triggerOnlineAccusation();
    } else {
      triggerAccusationPhase();
    }
  });

  DOM.btnGuessGlobal.addEventListener("click", () => {
    sfx.playBeep(500, 0.1);
    if (state.isOnline) {
      triggerOnlineSpyGuess();
    } else {
      triggerSpyGuessPhase();
    }
  });
  
  DOM.btnCancelGuess.addEventListener("click", () => {
    DOM.modalGuess.classList.add("hidden");
  });

  // Online Buttons Actions
  DOM.btnCreateLobbyTrigger.addEventListener("click", () => {
    sfx.init();
    sfx.playBeep(600, 0.08);
    const name = DOM.inputOnlineName.value.trim();
    if (!name) return alert("Please enter a codename.");
    connectWebSocket(name, true);
  });

  DOM.btnJoinLobbyTrigger.addEventListener("click", () => {
    sfx.playBeep(600, 0.08);
    DOM.onlineJoinFields.classList.remove("hidden");
  });

  DOM.btnBackToPrelobby.addEventListener("click", () => {
    sfx.playBeep(400, 0.08);
    DOM.onlineJoinFields.classList.add("hidden");
  });

  DOM.btnConnectRoom.addEventListener("click", () => {
    sfx.init();
    sfx.playBeep(600, 0.08);
    const name = DOM.inputOnlineName.value.trim();
    const roomCode = DOM.inputRoomCode.value.trim().toUpperCase();
    if (!name) return alert("Please enter a codename.");
    if (roomCode.length !== 4) return alert("Room encryption code must be 4 characters.");
    connectWebSocket(name, false, roomCode);
  });

  DOM.btnDisconnectLobby.addEventListener("click", () => {
    sfx.playBeep(400, 0.08);
    disconnectWebSocket();
  });

  DOM.btnStartOnlineGame.addEventListener("click", () => {
    sfx.playBeep(800, 0.1);
    startOnlineGame();
  });

  // Host configuration updates
  const handleHostSettingsChange = () => {
    if (!state.isOnline || !state.isHost || !state.socket) return;
    const total = parseInt(document.querySelector('input[name="online-total-players"]:checked').value);
    const duration = parseInt(DOM.onlineSelectTimer.value);

    state.socket.send(JSON.stringify({
      type: 'update_settings',
      totalPlayers: total,
      timerDuration: duration
    }));
  };

  document.querySelectorAll('input[name="online-total-players"]').forEach(rad => {
    rad.addEventListener("change", handleHostSettingsChange);
  });
  DOM.onlineSelectTimer.addEventListener("change", handleHostSettingsChange);
}

function switchView(phase) {
  state.gamePhase = phase;
  document.querySelectorAll(".game-view").forEach(v => v.classList.remove("active"));
  
  if (phase === "setup") DOM.viewSetup.classList.add("active");
  else if (phase === "reveal") DOM.viewReveal.classList.add("active");
  else if (phase === "gameplay") DOM.viewGameplay.classList.add("active");
  else if (phase === "gameover") DOM.viewGameOver.classList.add("active");
}

// 7. WEBSOCKET NETWORKING LAYER
function updateOnlineStatusLog(msg) {
  const line = `<div>[System] ${msg}</div>`;
  DOM.onlineConnStatus.innerHTML += line;
  DOM.onlineConnStatus.scrollTop = DOM.onlineConnStatus.scrollHeight;
}

function connectWebSocket(playerName, isHost, code = null) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || 'localhost';
  const wsUrl = `${protocol}//${hostname}:8082`;
  
  DOM.onlineConnStatus.innerHTML = "";
  updateOnlineStatusLog(`Syncing network node at ${wsUrl}...`);
  
  try {
    state.socket = new WebSocket(wsUrl);
  } catch (err) {
    updateOnlineStatusLog(`Link failure: ${err.message}`);
    return;
  }

  state.socket.onopen = () => {
    updateOnlineStatusLog("Secure interface established.");
    if (isHost) {
      state.socket.send(JSON.stringify({ type: 'create_room', playerName }));
    } else {
      state.socket.send(JSON.stringify({ type: 'join_room', roomCode: code, playerName }));
    }
  };

  state.socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleServerMessage(msg);
    } catch (e) {
      console.error("[Net] Failed to parse message:", e);
    }
  };

  state.socket.onerror = (err) => {
    updateOnlineStatusLog("Neural port handshake failed.");
  };

  state.socket.onclose = () => {
    updateOnlineStatusLog("Network connection severed.");
    state.socket = null;
    
    if (state.gamePhase !== "setup" && state.gamePhase !== "gameover") {
      alert("Comms link disconnected. Returning to setup console.");
      switchView("setup");
    }
  };
}

function disconnectWebSocket() {
  if (state.socket) {
    state.socket.close();
  }
  state.socket = null;
  state.isHost = false;
  state.roomCode = null;
  
  DOM.onlinePrelobbyView.classList.remove("hidden");
  DOM.onlineLobbyView.classList.add("hidden");
  DOM.onlineJoinFields.classList.add("hidden");
  DOM.onlineConnStatus.innerHTML = `[System] Web socket connection dormant.<br>[System] Select "Create" or "Join" to dial into the network.`;
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case 'room_created': {
      state.roomCode = msg.roomCode;
      state.playerId = msg.playerId;
      state.isHost = true;
      
      DOM.lobbyCodeDisplay.innerText = msg.roomCode;
      DOM.onlinePrelobbyView.classList.add("hidden");
      DOM.onlineLobbyView.classList.remove("hidden");
      DOM.lobbySettingsControls.classList.remove("hidden");
      DOM.lobbyGuestMessage.classList.add("hidden");
      DOM.btnStartOnlineGame.classList.remove("hidden");
      break;
    }

    case 'room_joined': {
      state.roomCode = msg.roomCode;
      state.playerId = msg.playerId;
      state.isHost = false;

      DOM.lobbyCodeDisplay.innerText = msg.roomCode;
      DOM.onlinePrelobbyView.classList.add("hidden");
      DOM.onlineLobbyView.classList.remove("hidden");
      DOM.lobbySettingsControls.classList.add("hidden");
      DOM.lobbyGuestMessage.classList.remove("hidden");
      DOM.btnStartOnlineGame.classList.add("hidden");
      break;
    }

    case 'room_lobby': {
      state.onlinePlayers = msg.players;
      
      // Render lobby list
      let listHTML = "";
      msg.players.forEach((pName, idx) => {
        const isHostLabel = (idx === msg.hostId) ? `<span class="lobby-host-badge font-mono">HOST</span>` : "";
        listHTML += `
          <div class="lobby-member-row">
            <span>OPERATIVE: ${pName.toUpperCase()}</span>
            ${isHostLabel}
          </div>
        `;
      });
      DOM.onlineLobbyPlayers.innerHTML = listHTML;
      break;
    }

    case 'settings_updated': {
      if (state.isHost) return; // Host already updated locally
      // Sync guest select UI with host settings
      DOM.onlineRadio2.checked = (msg.settings.totalPlayers === 2);
      DOM.onlineRadio3.checked = (msg.settings.totalPlayers === 3);
      DOM.onlineRadio4.checked = (msg.settings.totalPlayers === 4);
      DOM.onlineSelectTimer.value = msg.settings.timerDuration;
      break;
    }

    case 'game_started': {
      // Initialize state for online match
      state.startTime = Date.now();
      state.aiReasoningLogs = [];
      state.scratchpadCrossed.clear();
      state.timerDuration = msg.timerDuration;
      state.timerRemaining = msg.timerDuration;
      
      // Map safe players structure
      state.players = msg.players.map(p => {
        const suspicion = {};
        const spyProbs = {};
        for (let j = 0; j < msg.players.length; j++) {
          if (j !== p.id) suspicion[j] = 0;
        }
        LOCATIONS.forEach(loc => {
          spyProbs[loc.id] = 1 / LOCATIONS.length;
        });

        return {
          id: p.id,
          name: p.name,
          isAI: p.isAI,
          role: (p.id === state.playerId) ? msg.role : "CLASSIFIED",
          isSpy: (p.id === state.playerId) ? msg.isSpy : false,
          suspicion: suspicion,
          spyProbs: spyProbs,
          askedCount: 0
        };
      });

      // Find our own player client
      const localMe = state.players.find(p => p.id === state.playerId);
      localMe.isSpy = msg.isSpy;
      localMe.role = msg.role;
      if (msg.isSpy) {
        state.spyPlayer = localMe;
      } else {
        // Find location info matching server
        state.secretLocation = LOCATIONS.find(l => l.name === msg.secretLocationName);
      }

      // Check global guess visibility
      if (msg.isSpy) {
        DOM.btnGuessGlobal.classList.remove("hidden");
      } else {
        DOM.btnGuessGlobal.classList.add("hidden");
      }

      // Transition to reveal view to privately display role card
      state.gamePhase = "reveal";
      switchView("reveal");
      DOM.idCard.classList.remove("flipped");
      DOM.revealPlayerName.innerText = localMe.name.toUpperCase();

      DOM.btnRevealCard.onclick = () => {
        sfx.playReveal();
        DOM.idCard.classList.add("flipped");
        renderCardBack(localMe);
      };

      // In Online mode, the card close button opens the gameplay console directly
      DOM.btnMemorized.onclick = () => {
        sfx.playBeep(500, 0.08);
        DOM.idCard.classList.remove("flipped");
        setTimeout(() => {
          // Initialize gameplay board
          switchView("gameplay");
          DOM.terminalLog.innerHTML = "";
          
          // Render deduction checklist
          let scratchHTML = "";
          LOCATIONS.forEach(loc => {
            scratchHTML += `
              <div class="scratchpad-item font-mono" data-loc-id="${loc.id}">
                <span class="scratchpad-checkbox"></span>
                <span>${loc.name}</span>
              </div>
            `;
          });
          DOM.scratchpadLocations.innerHTML = scratchHTML;

          document.querySelectorAll(".scratchpad-item").forEach(item => {
            item.addEventListener("click", () => {
              sfx.playBeep(650, 0.05);
              const locId = item.getAttribute("data-loc-id");
              if (state.scratchpadCrossed.has(locId)) {
                state.scratchpadCrossed.delete(locId);
                item.classList.remove("crossed");
              } else {
                state.scratchpadCrossed.add(locId);
                item.classList.add("crossed");
              }
            });
          });
        }, 300);
      };
      break;
    }

    case 'timer_tick': {
      state.timerRemaining = msg.timerRemaining;
      updateTimerUI();
      break;
    }

    case 'game_state': {
      state.activePlayerIdx = msg.activePlayerIdx;
      state.lastQuestionTargetIdx = msg.lastQuestionTargetIdx;
      
      // Update timer UI
      state.timerRemaining = msg.timerRemaining;
      updateTimerUI();

      // Render Logs
      DOM.terminalLog.innerHTML = "";
      msg.logs.forEach(log => {
        const sender = (log.senderId !== undefined) ? state.players.find(p => p.id === log.senderId) : null;
        gameplayLog(log.text, log.type, sender);
      });

      // Update Turn Action panel
      if (msg.gameStatePhase === 'playing') {
        const active = state.players[state.activePlayerIdx];
        DOM.activePlayerDisplay.innerText = active.name.toUpperCase();
        DOM.activePlayerDisplay.className = active.isSpy ? "font-orbitron text-glow text-magenta" : "font-orbitron text-cyan";

        if (state.activePlayerIdx === state.playerId) {
          // It's your turn to ask!
          renderHumanAskConsole(active);
        } else {
          // Someone else's turn
          DOM.consoleActionArea.innerHTML = `
            <div class="waiting-screen font-mono">
              <h3>AWAITING TRANSMISSIONS</h3>
              <h2>OPERATIVE ${active.name.toUpperCase()} IS ACTIVE...</h2>
              <div class="terminal-dot green"></div>
            </div>
          `;

          // If Host client, run AI calculation ticks on behalf of bots!
          if (state.isHost && active.isAI) {
            setTimeout(() => runAIBotTurnOnline(active), 1500);
          }
        }
      }
      break;
    }

    case 'answer_submitted_event': {
      // Trigger Observer AI reasoning calculations dynamically on all clients
      const responder = state.players.find(p => p.id === msg.responderId);
      const question = QUESTIONS.find(q => q.id === msg.questionId);
      if (responder && question) {
        evaluateAnswerReasoning(responder, question, msg.answerText, msg.responseType);
      }
      break;
    }

    case 'voting_start': {
      state.gamePhase = "voting";
      state.voteAccuser = msg.accuserId;
      state.voteAccused = msg.accusedId;
      state.votesCast = msg.votesCast;

      DOM.modalVote.classList.remove("hidden");
      DOM.voteAccuserName.innerText = state.players[state.voteAccuser].name.toUpperCase();
      DOM.voteAccusedName.innerText = state.players[state.voteAccused].name.toUpperCase();

      renderOnlineVotingMatrixUI();

      // Check if this human client needs to vote
      if (state.playerId !== state.voteAccuser && state.playerId !== state.voteAccused) {
        DOM.humanVotingControls.classList.remove("hidden");
        DOM.votingHumanName.innerText = state.players[state.playerId].name.toUpperCase();

        DOM.btnVoteGuilty.onclick = () => {
          sfx.playBeep(700, 0.08);
          DOM.humanVotingControls.classList.add("hidden");
          state.socket.send(JSON.stringify({ type: 'submit_vote', vote: 'guilty' }));
        };

        DOM.btnVoteInnocent.onclick = () => {
          sfx.playBeep(500, 0.08);
          DOM.humanVotingControls.classList.add("hidden");
          state.socket.send(JSON.stringify({ type: 'submit_vote', vote: 'innocent' }));
        };
      }

      // If host, calculate votes for AI bots and send to server
      if (state.isHost) {
        setTimeout(() => {
          const aiVotes = {};
          state.players.forEach(p => {
            if (p.isAI && p.id !== state.voteAccused && p.id !== state.voteAccuser) {
              let vote = "innocent";
              if (p.isSpy) {
                // AI Spy logic
                vote = (state.voteAccused === state.spyPlayer.id) ? "innocent" : "guilty";
              } else {
                // AI Agent logic
                const sus = p.suspicion[state.voteAccused] || 0;
                vote = (sus >= 35) ? "guilty" : "innocent";
              }
              aiVotes[p.id] = vote;
              
              state.aiReasoningLogs.push({
                player: p.name,
                log: `[AI Vote] Voted ${vote.toUpperCase()} for accused ${state.players[state.voteAccused].name} (Suspicion: ${p.isSpy ? 'N/A (Spy)' : p.suspicion[state.voteAccused]}).`
              });
            }
          });

          // Upload bots votes
          state.socket.send(JSON.stringify({
            type: 'ai_submit_votes',
            aiVotes: aiVotes
          }));
        }, 1200);
      }
      break;
    }

    case 'vote_updated': {
      state.votesCast = msg.votesCast;
      renderOnlineVotingMatrixUI();
      break;
    }

    case 'voting_result': {
      state.votesCast = msg.votesCast;
      renderOnlineVotingMatrixUI();
      break;
    }

    case 'voting_resume': {
      DOM.modalVote.classList.add("hidden");
      DOM.humanVotingControls.classList.add("hidden");
      state.gamePhase = "gameplay";
      break;
    }

    case 'ai_log_broadcast': {
      state.aiReasoningLogs.push(msg.logObj);
      break;
    }

    case 'game_over_broadcast': {
      state.gamePhase = "gameover";
      clearInterval(state.timerInterval);
      
      DOM.modalVote.classList.add("hidden");
      DOM.modalGuess.classList.add("hidden");

      switchView("gameover");

      if (msg.spyWins) {
        DOM.gameoverOutcome.innerText = "SYSTEM COMPROMISED";
        DOM.gameoverOutcome.className = "gameover-banner font-orbitron lose";
        sfx.playLose();
      } else {
        DOM.gameoverOutcome.innerText = "MISSION ACCOMPLISHED";
        DOM.gameoverOutcome.className = "gameover-banner font-orbitron win";
        sfx.playWin();
      }

      DOM.debriefLocation.innerText = msg.secretLocationName.toUpperCase();
      DOM.debriefSpy.innerText = msg.spyName.toUpperCase();
      
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      DOM.debriefTime.innerText = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")} MIN`;
      DOM.debriefWinReason.innerText = msg.reason.toUpperCase();

      // Render players breakdown
      let playersListHTML = "";
      msg.playersBreakdown.forEach(p => {
        let roleText = p.isSpy ? "SPY" : `AGENT (${p.role})`;
        let cardClass = p.isSpy ? "debrief-player-card is-spy" : "debrief-player-card";
        
        let susText = "";
        if (p.isSpy) {
          let totalSus = 0;
          let count = 0;
          state.players.forEach(observer => {
            if (!observer.isSpy && observer.id !== p.id) {
              totalSus += observer.suspicion[p.id] || 0;
              count++;
            }
          });
          susText = `AVG SUSPICION: ${count > 0 ? Math.round(totalSus / count) : 0}%`;
        } else {
          const spy = msg.playersBreakdown.find(pl => pl.isSpy);
          const susOfSpy = state.players.find(pl => pl.id === p.id).suspicion[spy.id] || 0;
          susText = p.isAI ? `SUSPICION OF SPY: ${susOfSpy}%` : "HUMAN";
        }

        playersListHTML += `
          <div class="${cardClass}">
            <div class="player-meta">
              <span class="player-name-val">${p.name}</span>
              <span class="player-role-val font-mono">${roleText.toUpperCase()}</span>
            </div>
            <span class="player-sus-val font-mono text-cyan">${susText}</span>
          </div>
        `;
      });
      DOM.debriefPlayersList.innerHTML = playersListHTML;

      // Render AI logic records
      let logsHTML = "";
      if (state.aiReasoningLogs.length === 0) {
        logsHTML = `<div class="ai-logs-row text-muted">[NO AI DEDUCTION DATA LOGGED]</div>`;
      } else {
        state.aiReasoningLogs.forEach(logObj => {
          logsHTML += `
            <div class="ai-logs-row">
              <strong class="text-cyan">${logObj.player}:</strong> ${logObj.log}
            </div>
          `;
        });
      }
      DOM.aiLogsContent.innerHTML = logsHTML;
      break;
    }

    case 'error': {
      alert(msg.message);
      break;
    }
  }
}

function renderOnlineVotingMatrixUI() {
  let listHTML = "";
  state.players.forEach(p => {
    if (p.id === state.voteAccused) {
      listHTML += `
        <div class="vote-status-row">
          <span>${p.name.toUpperCase()} (ACCUSED)</span>
          <span class="vote-badge guilty font-mono">DEFENDANT</span>
        </div>
      `;
    } else if (p.id === state.voteAccuser) {
      listHTML += `
        <div class="vote-status-row">
          <span>${p.name.toUpperCase()} (ACCUSER)</span>
          <span class="vote-badge guilty font-mono">GUILTY (AUTO)</span>
        </div>
      `;
    } else {
      const vote = state.votesCast[p.id];
      let statusBadge = `<span class="vote-badge waiting font-mono">VOTING...</span>`;
      if (vote === "guilty") {
        statusBadge = `<span class="vote-badge guilty font-mono">GUILTY</span>`;
      } else if (vote === "innocent") {
        statusBadge = `<span class="vote-badge innocent font-mono">INNOCENT</span>`;
      }
      
      listHTML += `
        <div class="vote-status-row">
          <span>${p.name.toUpperCase()}</span>
          ${statusBadge}
        </div>
      `;
    }
  });
  DOM.votingPlayersStatus.innerHTML = listHTML;
}

// 8. ONLINE MISSION INITIALIZATION (HOST SENDS)
function startOnlineGame() {
  if (!state.isOnline || !state.isHost || !state.socket) return;

  const total = parseInt(document.querySelector('input[name="online-total-players"]:checked').value);
  const duration = parseInt(DOM.onlineSelectTimer.value);

  // 1. Choose location
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const spyIdx = Math.floor(Math.random() * total);

  // 2. Roles assignments setup
  let availableRoles = [...loc.roles];
  shuffleArray(availableRoles);

  const assignments = [];
  for (let i = 0; i < total; i++) {
    const isSpy = (i === spyIdx);
    assignments.push({
      id: i,
      isSpy: isSpy,
      role: isSpy ? "Spy" : (availableRoles.pop() || "Agent")
    });
  }

  state.socket.send(JSON.stringify({
    type: 'start_game',
    secretLocationId: loc.id,
    secretLocationName: loc.name,
    timerDuration: duration,
    assignments: assignments
  }));
}

// 9. HOST-SIDE AI CONTROLLER FOR ONLINE LOBBY
function runAIBotTurnOnline(aiPlayer) {
  if (!state.isOnline || !state.isHost || !state.socket || state.gamePhase !== 'gameplay') return;

  // 1. AI Spy decides if it should guess location
  if (aiPlayer.isSpy) {
    let bestLocId = null;
    let maxProb = 0;
    Object.keys(aiPlayer.spyProbs).forEach(locId => {
      if (aiPlayer.spyProbs[locId] > maxProb) {
        maxProb = aiPlayer.spyProbs[locId];
        bestLocId = locId;
      }
    });

    if (maxProb >= 0.75 && bestLocId) {
      const locObj = LOCATIONS.find(l => l.id === bestLocId);
      state.socket.send(JSON.stringify({
        type: 'ai_spy_guess',
        spyId: aiPlayer.id,
        locationId: bestLocId,
        locationName: locObj.name
      }));
      return;
    }
  }

  // 2. AI Agent decides if it should accuse
  if (!aiPlayer.isSpy) {
    let mostSuspiciousId = null;
    let maxSus = 0;
    Object.keys(aiPlayer.suspicion).forEach(id => {
      const sus = aiPlayer.suspicion[id];
      if (sus > maxSus) {
        maxSus = sus;
        mostSuspiciousId = parseInt(id);
      }
    });

    const threshold = (state.timerRemaining < 30) ? 50 : 65;
    if (maxSus >= threshold && mostSuspiciousId !== null) {
      const accused = state.players[mostSuspiciousId];
      
      const logObj = {
        player: aiPlayer.name,
        log: `[AI Agent] suspicion of ${accused.name} reached ${maxSus}%. Initiating accusation.`
      };
      state.socket.send(JSON.stringify({ type: 'ai_log', logObj }));
      
      state.socket.send(JSON.stringify({
        type: 'accuse',
        accusedId: accused.id
      }));
      return;
    }
  }

  // 3. Normal questioning flow: AI selects target
  let target = null;
  if (aiPlayer.isSpy) {
    let candidates = state.players.filter(p => p.id !== aiPlayer.id && p.id !== state.lastQuestionTargetIdx);
    if (candidates.length === 0) candidates = state.players.filter(p => p.id !== aiPlayer.id);
    target = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    let candidates = state.players.filter(p => p.id !== aiPlayer.id && p.id !== state.lastQuestionTargetIdx);
    if (candidates.length === 0) candidates = state.players.filter(p => p.id !== aiPlayer.id);
    
    let highestSusId = -1;
    let highestSusVal = -1;
    candidates.forEach(c => {
      const val = aiPlayer.suspicion[c.id] || 0;
      if (val > highestSusVal) {
        highestSusVal = val;
        highestSusId = c.id;
      }
    });
    target = state.players.find(p => p.id === highestSusId);
  }

  // AI selects question
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

  // If target is AI as well, Host client computes AI answer instantly
  if (target.isAI) {
    const answerText = computeAIAnswer(target, question);
    
    state.socket.send(JSON.stringify({
      type: 'ai_action',
      action: 'ask',
      askerId: aiPlayer.id,
      targetId: target.id,
      questionText: question.text
    }));

    setTimeout(() => {
      state.socket.send(JSON.stringify({
        type: 'ai_action',
        action: 'answer',
        responderId: target.id,
        questionId: question.id,
        answerText: answerText
      }));
    }, 1200);
  } else {
    // Target is human: transmit ask action to server (it prompts target human)
    state.socket.send(JSON.stringify({
      type: 'ask_question',
      targetId: target.id,
      questionText: question.text,
      questionId: question.id
    }));
  }
}

// 10. OFFLINE SETUP (LOCAL PLAY)
function setupLocalMission() {
  state.timerDuration = parseInt(DOM.selectTimer.value);
  state.timerRemaining = state.timerDuration;
  state.scratchpadCrossed.clear();
  state.aiReasoningLogs = [];
  state.startTime = Date.now();
  
  state.secretLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const spyIdx = Math.floor(Math.random() * state.totalPlayers);
  
  state.players = [];
  let availableRoles = [...state.secretLocation.roles];
  shuffleArray(availableRoles);

  for (let i = 0; i < state.totalPlayers; i++) {
    const isHuman = i < state.humanPlayers;
    const nameInput = document.getElementById(`player-name-${i}`);
    let name = nameInput ? nameInput.value.trim() : "";
    if (!name) name = isHuman ? `Operative ${i + 1}` : AI_NAMES[i % AI_NAMES.length];
    
    const isSpy = (i === spyIdx);
    const suspicion = {};
    const spyProbs = {};
    for (let j = 0; j < state.totalPlayers; j++) {
      if (j !== i) suspicion[j] = 0;
    }
    LOCATIONS.forEach(loc => {
      spyProbs[loc.id] = 1 / LOCATIONS.length;
    });

    state.players.push({
      id: i,
      name: name,
      isAI: !isHuman,
      isSpy: isSpy,
      role: isSpy ? "Spy" : availableRoles.pop() || "Agent",
      suspicion: suspicion,
      spyProbs: spyProbs,
      askedCount: 0
    });

    if (isSpy) {
      state.spyPlayer = state.players[i];
    }
  }

  DOM.btnGuessGlobal.classList.add("hidden");

  state.revealPlayerIdx = 0;
  startLocalRevealPlayer(0);
}

function startLocalRevealPlayer(idx) {
  if (idx >= state.totalPlayers) {
    startLocalGameplay();
    return;
  }

  const p = state.players[idx];
  if (p.isAI) {
    startLocalRevealPlayer(idx + 1);
    return;
  }

  state.revealPlayerIdx = idx;
  switchView("reveal");
  DOM.idCard.classList.remove("flipped");
  DOM.revealPlayerName.innerText = p.name.toUpperCase();
  
  DOM.btnRevealCard.onclick = () => {
    sfx.playReveal();
    DOM.idCard.classList.add("flipped");
    renderCardBack(p);
  };
}

function startLocalGameplay() {
  switchView("gameplay");
  
  let scratchHTML = "";
  LOCATIONS.forEach(loc => {
    scratchHTML += `
      <div class="scratchpad-item font-mono" data-loc-id="${loc.id}">
        <span class="scratchpad-checkbox"></span>
        <span>${loc.name}</span>
      </div>
    `;
  });
  DOM.scratchpadLocations.innerHTML = scratchHTML;

  document.querySelectorAll(".scratchpad-item").forEach(item => {
    item.addEventListener("click", () => {
      sfx.playBeep(650, 0.05);
      const locId = item.getAttribute("data-loc-id");
      if (state.scratchpadCrossed.has(locId)) {
        state.scratchpadCrossed.delete(locId);
        item.classList.remove("crossed");
      } else {
        state.scratchpadCrossed.add(locId);
        item.classList.add("crossed");
      }
    });
  });

  state.activePlayerIdx = 0; 
  state.lastQuestionTargetIdx = null;
  DOM.terminalLog.innerHTML = "";

  const humanSpy = state.players.find(p => !p.isAI && p.isSpy);
  if (humanSpy) {
    DOM.btnGuessGlobal.classList.remove("hidden");
  } else {
    DOM.btnGuessGlobal.classList.add("hidden");
  }

  gameplayLog("NEURAL ENCRYPTION SYNCED. LOCAL SESSION START.", "system");
  gameplayLog("MISSION INITIATED. UNMASK THE INTRUDER.", "system");
  
  startLocalTimer();
  startTurn();
}

function startLocalTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  updateTimerUI();
  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    updateTimerUI();
    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      gameplayLog("TIMER EXPIRED. CONSENSUS ACCUSATION PROTOCOL TRIGGERED.", "error");
      sfx.playAlarm();
      setTimeout(() => forceEndgameVote(), 1500);
    }
  }, 1000);
}

// 11. LOCAL ACCUSATION & GUESS HOOKS
function triggerOnlineAccusation() {
  // Online human triggers accusation: Select target
  const caller = state.players[state.playerId];
  let candidatesHTML = "";
  state.players.forEach(p => {
    if (p.id !== state.playerId) {
      candidatesHTML += `
        <button class="option-btn font-mono online-accuse-btn" data-target-id="${p.id}">
          OPERATIVE: ${p.name.toUpperCase()}
        </button>
      `;
    }
  });

  DOM.modalVote.classList.remove("hidden");
  DOM.voteAccuserName.innerText = caller.name.toUpperCase();
  DOM.voteAccusedName.innerText = "PENDING...";
  
  DOM.votingPlayersStatus.innerHTML = `
    <div class="font-mono text-center">
      <span class="text-cyan">SELECT ACCUSATION TARGET:</span>
      <div class="options-list" style="margin-top: 1rem;">
        ${candidatesHTML}
      </div>
      <button id="btn-cancel-online-accuse" class="btn-secondary font-mono" style="margin-top: 1rem; width: 100%;">ABORT</button>
    </div>
  `;

  document.getElementById("btn-cancel-online-accuse").addEventListener("click", () => {
    sfx.playBeep(400, 0.08);
    DOM.modalVote.classList.add("hidden");
  });

  document.querySelectorAll(".online-accuse-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playBeep(800, 0.1);
      const targetId = parseInt(btn.getAttribute("data-target-id"));
      DOM.modalVote.classList.add("hidden");
      
      state.socket.send(JSON.stringify({
        type: 'accuse',
        accusedId: targetId
      }));
    });
  });
}

function triggerOnlineSpyGuess() {
  DOM.modalGuess.classList.remove("hidden");
  
  let gridHTML = "";
  LOCATIONS.forEach(loc => {
    gridHTML += `
      <button class="guess-btn font-orbitron online-guess-btn" data-loc-id="${loc.id}">
        ${loc.name.toUpperCase()}
      </button>
    `;
  });
  DOM.spyGuessList.innerHTML = gridHTML;

  document.querySelectorAll(".online-guess-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const locId = btn.getAttribute("data-loc-id");
      const locObj = LOCATIONS.find(l => l.id === locId);
      
      DOM.modalGuess.classList.add("hidden");
      
      state.socket.send(JSON.stringify({
        type: 'spy_guess',
        locationId: locId,
        locationName: locObj.name
      }));
    });
  });
}

// 12. SHARED TURN SYSTEM
function startTurn() {
  const activePlayer = state.players[state.activePlayerIdx];
  DOM.activePlayerDisplay.innerText = activePlayer.name.toUpperCase();
  DOM.activePlayerDisplay.className = activePlayer.isSpy ? "font-orbitron text-glow text-magenta" : "font-orbitron text-cyan";

  gameplayLog(`Transmission control granted to ${activePlayer.name}.`, "system");
  sfx.playAlert();

  if (activePlayer.isAI) {
    DOM.consoleActionArea.innerHTML = `
      <div class="waiting-screen font-mono">
        <h3>AWAITING NEURAL PROCESSES</h3>
        <h2>${activePlayer.name.toUpperCase()} ANALYSIS IN PROGRESS...</h2>
        <div class="terminal-dot green"></div>
      </div>
    `;
    setTimeout(() => runAILocalTurn(activePlayer), 2000);
  } else {
    renderHumanAskConsole(activePlayer);
  }
}

// HUMAN ACTIONS CONSOLE (Used locally & sends to WS online)
function renderHumanAskConsole(player) {
  let targetsHTML = "";
  state.players.forEach(p => {
    if (p.id !== player.id) {
      const isLastTarget = (p.id === state.lastQuestionTargetIdx);
      const disabledAttr = isLastTarget ? "disabled style='opacity: 0.4'" : "";
      const labelSuffix = isLastTarget ? " (Locked)" : "";
      targetsHTML += `
        <button class="option-btn font-mono target-select-btn" data-target-id="${p.id}" ${disabledAttr}>
          ID: ${p.name.toUpperCase()} ${labelSuffix}
        </button>
      `;
    }
  });

  DOM.consoleActionArea.innerHTML = `
    <div class="console-phase">
      <span class="font-orbitron text-xs text-cyan">STEP 1: SELECT TARGET OPERATIVE</span>
      <div class="options-list">
        ${targetsHTML}
      </div>
    </div>
  `;

  document.querySelectorAll(".target-select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playBeep(600, 0.08);
      const targetId = parseInt(btn.getAttribute("data-target-id"));
      renderHumanQuestionSelect(player, targetId);
    });
  });
}

function renderHumanQuestionSelect(player, targetId) {
  const target = state.players[targetId];
  
  let questionsHTML = "";
  QUESTIONS.forEach((q, idx) => {
    questionsHTML += `
      <button class="option-btn font-mono question-select-btn" data-q-idx="${idx}">
        ${q.text}
      </button>
    `;
  });

  DOM.consoleActionArea.innerHTML = `
    <div class="console-phase">
      <span class="font-orbitron text-xs text-magenta">STEP 2: CHOOSE INTEL DIRECTION (ASK ${target.name.toUpperCase()})</span>
      <div class="options-list">
        ${questionsHTML}
        <button class="option-btn font-mono text-cyan" id="btn-custom-question">[WRITE CUSTOM TRANSMISSION]</button>
      </div>
      <div class="console-actions-row">
        <button id="btn-back-to-target" class="btn-secondary font-mono">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-back-to-target").addEventListener("click", () => {
    sfx.playBeep(400, 0.08);
    renderHumanAskConsole(player);
  });

  document.querySelectorAll(".question-select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playBeep(600, 0.08);
      const qIdx = parseInt(btn.getAttribute("data-q-idx"));
      executeQuestionLocalOrOnline(player, target, QUESTIONS[qIdx]);
    });
  });

  const customBtn = document.getElementById("btn-custom-question");
  if (customBtn) {
    customBtn.addEventListener("click", () => {
      sfx.playBeep(600, 0.08);
      renderHumanCustomQuestionInput(player, target);
    });
  }
}

function renderHumanCustomQuestionInput(player, target) {
  DOM.consoleActionArea.innerHTML = `
    <div class="console-phase">
      <span class="font-orbitron text-xs text-magenta font-bold">TRANSMIT CUSTOM QUESTION TO ${target.name.toUpperCase()}</span>
      <input type="text" id="input-custom-q" class="input-custom-answer font-mono" placeholder="Type question..." maxLength="60">
      <div class="console-actions-row">
        <button id="btn-back-to-qlist" class="btn-secondary font-mono">BACK</button>
        <button id="btn-submit-custom-q" class="btn-primary font-mono">TRANSMIT</button>
      </div>
    </div>
  `;

  document.getElementById("btn-back-to-qlist").addEventListener("click", () => {
    sfx.playBeep(400, 0.08);
    renderHumanQuestionSelect(player, target.id);
  });

  document.getElementById("btn-submit-custom-q").addEventListener("click", () => {
    const inputVal = document.getElementById("input-custom-q").value.trim();
    if (!inputVal) return;
    sfx.playBeep(700, 0.1);
    
    const customQ = {
      id: "custom",
      text: inputVal,
      attribute: "custom",
      answers: null
    };
    executeQuestionLocalOrOnline(player, target, customQ);
  });
}

function executeQuestionLocalOrOnline(asker, target, question) {
  if (state.isOnline) {
    // Send to WebSocket
    state.socket.send(JSON.stringify({
      type: 'ask_question',
      targetId: target.id,
      questionText: question.text,
      questionId: question.id
    }));
  } else {
    // Local flow
    gameplayLog(question.text, "action", asker);
    state.lastQuestionTargetIdx = asker.id;

    if (target.isAI) {
      setTimeout(() => {
        const answerText = computeAIAnswer(target, question);
        gameplayLog(answerText, "msg", target);
        evaluateAnswerReasoning(target, question, answerText);
        state.activePlayerIdx = target.id;
        setTimeout(() => startTurn(), 1500);
      }, 1200);
    } else {
      renderHumanAnswerWait(asker, target, question);
    }
  }
}

// 13. SHARED RESPONSE SELECTION
function renderHumanAnswerWait(asker, target, question) {
  DOM.consoleActionArea.innerHTML = `
    <div class="waiting-screen font-mono">
      <h3>SECURE THE TERMINAL</h3>
      <h2>PASS CONSOLE TO: ${target.name.toUpperCase()}</h2>
      <button id="btn-reveal-answer-panel" class="btn-primary font-orbitron">CONFIRM BIOMETRICS</button>
    </div>
  `;

  const btnRevealAnswerPanel = document.getElementById("btn-reveal-answer-panel");
  btnRevealAnswerPanel.addEventListener("click", () => {
    sfx.playReveal();
    renderHumanAnswerInterface(asker, target, question);
  });
}

function renderHumanAnswerInterface(asker, target, question) {
  let answersHTML = "";
  
  if (question.id !== "custom") {
    // If online, role/location is locally cached, same for offline
    const isSpyActive = target.isSpy;
    
    let trueAttrVal = "normal";
    if (!isSpyActive) {
      const loc = state.isOnline 
        ? state.secretLocation // Already mapped for agents in online
        : state.secretLocation;
      trueAttrVal = loc.attributes[question.attribute];
    }

    const trueList = question.answers[trueAttrVal] || [];
    
    let decoyList = [];
    Object.keys(question.answers).forEach(key => {
      if (key !== trueAttrVal) {
        decoyList.push(...question.answers[key]);
      }
    });
    
    let options = [];
    if (!isSpyActive && trueList.length > 0) options.push({ text: trueList[0], type: "truth" });
    if (!isSpyActive && trueList.length > 1) options.push({ text: trueList[1], type: "truth" });
    if (decoyList.length > 0) options.push({ text: decoyList[0], type: "decoy" });
    options.push({ text: SPY_VAGUE_ANSWERS[Math.floor(Math.random() * SPY_VAGUE_ANSWERS.length)], type: "vague" });
    
    shuffleArray(options);

    options.forEach(opt => {
      answersHTML += `
        <button class="option-btn font-mono ans-select-btn" data-ans-type="${opt.type}">
          ${opt.text}
        </button>
      `;
    });
  }

  DOM.consoleActionArea.innerHTML = `
    <div class="console-phase">
      <span class="font-orbitron text-xs text-cyan">INCOMING QUESTION FROM ${asker.name.toUpperCase()}:</span>
      <p class="font-mono text-sm text-glow" style="margin-bottom: 0.5rem;">"${question.text}"</p>
      
      <span class="font-orbitron text-xs text-magenta">SELECT RESPONSE MODE:</span>
      <div class="options-list">
        ${answersHTML}
      </div>
      <input type="text" id="input-custom-ans" class="input-custom-answer font-mono" placeholder="Type custom answer..." maxLength="60" style="margin-top: 0.5rem;">
      
      <div class="console-actions-row">
        <button id="btn-submit-custom-ans" class="btn-primary font-mono">TRANSMIT CUSTOM ANSWER</button>
      </div>
    </div>
  `;

  document.querySelectorAll(".ans-select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playBeep(700, 0.1);
      const ansText = btn.innerText.trim();
      const ansType = btn.getAttribute("data-ans-type");
      
      if (state.isOnline) {
        state.socket.send(JSON.stringify({
          type: 'submit_answer',
          answerText: ansText,
          responseType: ansType,
          questionId: question.id
        }));
      } else {
        submitAnswerLocal(target, question, ansText, ansType);
      }
    });
  });

  document.getElementById("btn-submit-custom-ans").addEventListener("click", () => {
    const textVal = document.getElementById("input-custom-ans").value.trim();
    if (!textVal) return;
    sfx.playBeep(700, 0.1);
    
    if (state.isOnline) {
      state.socket.send(JSON.stringify({
        type: 'submit_answer',
        answerText: textVal,
        responseType: "custom",
        questionId: question.id
      }));
    } else {
      submitAnswerLocal(target, question, textVal, "custom");
    }
  });
}

function submitAnswerLocal(target, question, answerText, type) {
  gameplayLog(answerText, "msg", target);
  evaluateAnswerReasoning(target, question, answerText, type);
  state.activePlayerIdx = target.id;
  setTimeout(() => startTurn(), 1500);
}

// 14. LOCAL AI REASONER CALCULATIONS
function runAILocalTurn(aiPlayer) {
  if (state.gamePhase !== "gameplay") return;

  if (aiPlayer.isSpy) {
    let bestLocId = null;
    let maxProb = 0;
    Object.keys(aiPlayer.spyProbs).forEach(locId => {
      if (aiPlayer.spyProbs[locId] > maxProb) {
        maxProb = aiPlayer.spyProbs[locId];
        bestLocId = locId;
      }
    });

    if (maxProb >= 0.75 && bestLocId) {
      clearInterval(state.timerInterval);
      gameplayLog(`REVEALS THEMSELVES AS THE SPY!`, "error", aiPlayer);
      const locObj = LOCATIONS.find(l => l.id === bestLocId);
      
      setTimeout(() => {
        gameplayLog(`Guesses location is: ${locObj.name.toUpperCase()}`, "error", aiPlayer);
        
        const correct = (bestLocId === state.secretLocation.id);
        if (correct) {
          endGame(true, `${aiPlayer.name} (Spy) successfully deduced the location.`);
        } else {
          endGame(false, `${aiPlayer.name} (Spy) guessed the location incorrectly (${locObj.name}).`);
        }
      }, 1500);
      return;
    }
  }

  if (!aiPlayer.isSpy) {
    let mostSuspiciousId = null;
    let maxSus = 0;
    Object.keys(aiPlayer.suspicion).forEach(id => {
      const sus = aiPlayer.suspicion[id];
      if (sus > maxSus) {
        maxSus = sus;
        mostSuspiciousId = parseInt(id);
      }
    });

    const threshold = (state.timerRemaining < 30) ? 50 : 65;
    if (maxSus >= threshold && mostSuspiciousId !== null) {
      clearInterval(state.timerInterval);
      const accused = state.players[mostSuspiciousId];
      gameplayLog(`Calls emergency accusation against ${accused.name}!`, "error", aiPlayer);
      
      state.aiReasoningLogs.push({
        player: aiPlayer.name,
        log: `[AI Agent] Suspicion of ${accused.name} reached ${maxSus} (Threshold: ${threshold}). Initiating accusation.`
      });

      setTimeout(() => {
        triggerAccusationPhase(aiPlayer.id, mostSuspiciousId);
      }, 1500);
      return;
    }
  }

  let target = null;
  if (aiPlayer.isSpy) {
    let candidates = state.players.filter(p => p.id !== aiPlayer.id && p.id !== state.lastQuestionTargetIdx);
    if (candidates.length === 0) candidates = state.players.filter(p => p.id !== aiPlayer.id);
    target = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    let candidates = state.players.filter(p => p.id !== aiPlayer.id && p.id !== state.lastQuestionTargetIdx);
    if (candidates.length === 0) candidates = state.players.filter(p => p.id !== aiPlayer.id);
    
    let highestSusId = -1;
    let highestSusVal = -1;
    candidates.forEach(c => {
      const val = aiPlayer.suspicion[c.id] || 0;
      if (val > highestSusVal) {
        highestSusVal = val;
        highestSusId = c.id;
      }
    });
    
    target = state.players.find(p => p.id === highestSusId);
  }

  let question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  executeQuestionLocalOrOnline(aiPlayer, target, question);
}

// 15. SHARED LOGICAL ANSWER EVALUATION
function computeAIAnswer(aiPlayer, question) {
  if (aiPlayer.isSpy) {
    let bestLocId = null;
    let maxProb = 0;
    Object.keys(aiPlayer.spyProbs).forEach(locId => {
      if (aiPlayer.spyProbs[locId] > maxProb) {
        maxProb = aiPlayer.spyProbs[locId];
        bestLocId = locId;
      }
    });

    const isConfident = (maxProb >= 0.5); 
    
    if (question.id !== "custom" && isConfident && bestLocId) {
      const locObj = LOCATIONS.find(l => l.id === bestLocId);
      const attrVal = locObj.attributes[question.attribute];
      const matchingAnswers = question.answers[attrVal];
      if (matchingAnswers && matchingAnswers.length > 0) {
        const selectedAns = matchingAnswers[Math.floor(Math.random() * matchingAnswers.length)];
        
        const logObj = {
          player: aiPlayer.name,
          log: `[AI Spy] Answering "${question.text}" matching hypothesized location "${locObj.name}" (${Math.round(maxProb * 100)}% confidence).`
        };
        logNeuralReasoning(aiPlayer, logObj);
        return selectedAns;
      }
    }

    const logObj = {
      player: aiPlayer.name,
      log: `[AI Spy] Low confidence in locations (${Math.round(maxProb * 100)}% max). Answering vaguely.`
    };
    logNeuralReasoning(aiPlayer, logObj);
    return SPY_VAGUE_ANSWERS[Math.floor(Math.random() * SPY_VAGUE_ANSWERS.length)];

  } else {
    // Agents always tell truth
    if (question.id !== "custom") {
      const loc = state.isOnline 
        ? state.secretLocation 
        : state.secretLocation;

      const trueAttrVal = loc.attributes[question.attribute];
      const trueAnswers = question.answers[trueAttrVal];
      const selected = trueAnswers[Math.floor(Math.random() * trueAnswers.length)];
      
      const logObj = {
        player: aiPlayer.name,
        log: `[AI Agent] Answering truthfully according to ${loc.name} (${question.attribute}: ${trueAttrVal}).`
      };
      logNeuralReasoning(aiPlayer, logObj);
      return selected;
    }
    
    return "Yes, everything seems consistent with our standard protocols.";
  }
}

function logNeuralReasoning(aiPlayer, logObj) {
  if (state.isOnline) {
    // Upload log to server to sync
    if (state.isHost) {
      state.socket.send(JSON.stringify({ type: 'ai_log', logObj }));
    }
  } else {
    state.aiReasoningLogs.push(logObj);
  }
}

function evaluateAnswerReasoning(responder, question, answerText, responseType = "ai") {
  if (question.id === "custom") return;

  state.players.forEach(observer => {
    if (observer.id === responder.id) return; 

    if (observer.isAI) {
      if (observer.isSpy) {
        // Spy logic: narrow down locations
        let matchedAttrVal = null;
        Object.keys(question.answers).forEach(val => {
          if (question.answers[val].includes(answerText)) {
            matchedAttrVal = val;
          }
        });

        if (matchedAttrVal) {
          let validCount = 0;
          LOCATIONS.forEach(loc => {
            if (loc.attributes[question.attribute] === matchedAttrVal) {
              validCount++;
            }
          });

          if (validCount > 0) {
            let totalEliminatedProb = 0;
            LOCATIONS.forEach(loc => {
              if (loc.attributes[question.attribute] !== matchedAttrVal) {
                totalEliminatedProb += observer.spyProbs[loc.id];
                observer.spyProbs[loc.id] = 0;
              }
            });

            LOCATIONS.forEach(loc => {
              if (loc.attributes[question.attribute] === matchedAttrVal) {
                observer.spyProbs[loc.id] += totalEliminatedProb / validCount;
              }
            });

            let sum = 0;
            Object.values(observer.spyProbs).forEach(v => sum += v);
            if (sum > 0) {
              LOCATIONS.forEach(loc => observer.spyProbs[loc.id] /= sum);
            }

            const logObj = {
              player: observer.name,
              log: `[AI Spy] Observed ${responder.name}'s answer implying ${question.attribute} is "${matchedAttrVal}". Updated location grid.`
            };
            logNeuralReasoning(observer, logObj);
          }
        }
      } else {
        // Agent logic: check lies
        const loc = state.isOnline 
          ? state.secretLocation 
          : state.secretLocation;
        
        if (!loc) return; // Spy does not observe agents this way
        
        const realAttrVal = loc.attributes[question.attribute];
        let answerMatchesReal = false;
        let isVague = SPY_VAGUE_ANSWERS.includes(answerText) || responseType === "vague";
        
        let matchedAttrVal = null;
        Object.keys(question.answers).forEach(val => {
          if (question.answers[val].includes(answerText)) {
            matchedAttrVal = val;
          }
        });

        if (matchedAttrVal === realAttrVal) {
          answerMatchesReal = true;
        }

        const prevSus = observer.suspicion[responder.id] || 0;
        let change = 0;

        if (responseType === "custom") {
          change = 5;
        } else if (isVague) {
          change = 15;
        } else if (!answerMatchesReal && matchedAttrVal !== null) {
          change = 40;
        } else if (answerMatchesReal) {
          change = -10;
        }

        observer.suspicion[responder.id] = Math.max(0, Math.min(100, prevSus + change));

        const logObj = {
          player: observer.name,
          log: `[AI Agent] Evaluated ${responder.name}'s response for ${question.attribute}. Match: ${answerMatchesReal}, Vague: ${isVague}. Suspicion score adjusted from ${prevSus}% to ${observer.suspicion[responder.id]}%.`
        };
        logNeuralReasoning(observer, logObj);
      }
    }
  });
}

// 16. LOCAL ACCUSATION PROTOCOLS
function triggerAccusationPhase(callerId = null, accusedId = null) {
  clearInterval(state.timerInterval);
  state.gamePhase = "voting";
  DOM.modalVote.classList.remove("hidden");
  
  if (callerId === null) {
    const humanClicker = state.players.find(p => !p.isAI && p.id === state.activePlayerIdx) || state.players.find(p => !p.isAI);
    callerId = humanClicker.id;
    
    renderLocalAccusedSelection(callerId);
  } else {
    state.voteAccuser = callerId;
    state.voteAccused = accusedId;
    startLocalVotingProcess();
  }
}

function renderLocalAccusedSelection(callerId) {
  const caller = state.players[callerId];
  let candidatesHTML = "";
  state.players.forEach(p => {
    if (p.id !== callerId) {
      candidatesHTML += `
        <button class="option-btn font-mono accuse-target-btn" data-target-id="${p.id}">
          OPERATIVE: ${p.name.toUpperCase()}
        </button>
      `;
    }
  });

  DOM.voteAccuserName.innerText = caller.name.toUpperCase();
  DOM.voteAccusedName.innerText = "PENDING...";
  
  DOM.votingPlayersStatus.innerHTML = `
    <div class="font-mono text-center">
      <span class="text-cyan">SELECT ACCUSATION TARGET:</span>
      <div class="options-list" style="margin-top: 1rem;">
        ${candidatesHTML}
      </div>
      <button id="btn-cancel-accusation" class="btn-secondary font-mono" style="margin-top: 1rem; width: 100%;">ABORT ACCUSATION</button>
    </div>
  `;

  document.getElementById("btn-cancel-accusation").addEventListener("click", () => {
    sfx.playBeep(400, 0.08);
    DOM.modalVote.classList.add("hidden");
    resumeLocalGameplay();
  });

  document.querySelectorAll(".accuse-target-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playBeep(800, 0.1);
      const targetId = parseInt(btn.getAttribute("data-target-id"));
      state.voteAccuser = callerId;
      state.voteAccused = targetId;
      startLocalVotingProcess();
    });
  });
}

function startLocalVotingProcess() {
  const accuser = state.players[state.voteAccuser];
  const accused = state.players[state.voteAccused];

  DOM.voteAccuserName.innerText = accuser.name.toUpperCase();
  DOM.voteAccusedName.innerText = accused.name.toUpperCase();
  
  state.votesCast = {};
  state.votesCast[state.voteAccuser] = "guilty"; 
  collectNextLocalVote(0);
}

function collectNextLocalVote(idx) {
  if (idx >= state.totalPlayers) {
    tallyLocalVotes();
    return;
  }

  if (idx === state.voteAccuser || idx === state.voteAccused) {
    collectNextLocalVote(idx + 1);
    return;
  }

  const voter = state.players[idx];
  renderOnlineVotingMatrixUI(); // uses same UI layout

  if (voter.isAI) {
    setTimeout(() => {
      let vote = "innocent";
      if (voter.isSpy) {
        vote = (state.voteAccused === state.spyPlayer.id) ? "innocent" : "guilty";
      } else {
        const sus = voter.suspicion[state.voteAccused] || 0;
        vote = (sus >= 35) ? "guilty" : "innocent";
      }
      
      state.votesCast[voter.id] = vote;
      
      state.aiReasoningLogs.push({
        player: voter.name,
        log: `[AI Vote] Voted ${vote.toUpperCase()} for accused ${state.players[state.voteAccused].name} (Suspicion: ${voter.isSpy ? 'N/A (Spy)' : voter.suspicion[state.voteAccused]}%).`
      });

      sfx.playBeep(500, 0.05);
      collectNextLocalVote(idx + 1);
    }, 1000);
  } else {
    DOM.humanVotingControls.classList.remove("hidden");
    DOM.votingHumanName.innerText = voter.name.toUpperCase();
    
    DOM.btnVoteGuilty.onclick = () => {
      sfx.playBeep(700, 0.08);
      state.votesCast[voter.id] = "guilty";
      DOM.humanVotingControls.classList.add("hidden");
      collectNextLocalVote(idx + 1);
    };

    DOM.btnVoteInnocent.onclick = () => {
      sfx.playBeep(500, 0.08);
      state.votesCast[voter.id] = "innocent";
      DOM.humanVotingControls.classList.add("hidden");
      collectNextLocalVote(idx + 1);
    };
  }
}

function tallyLocalVotes() {
  renderOnlineVotingMatrixUI();
  
  let guiltyCount = 0;
  let innocentCount = 0;
  
  state.players.forEach(p => {
    if (p.id !== state.voteAccused) {
      if (state.votesCast[p.id] === "guilty") guiltyCount++;
      else innocentCount++;
    }
  });

  const totalVoters = state.totalPlayers - 1;
  const majorityNeeded = Math.ceil(totalVoters / 2 + 0.1);

  setTimeout(() => {
    DOM.modalVote.classList.add("hidden");
    
    if (guiltyCount >= majorityNeeded) {
      gameplayLog(`Emergency vote passed. ${state.players[state.voteAccused].name} is executed by majority consensus (${guiltyCount}/${totalVoters} votes).`, "error");
      
      const isSpy = state.players[state.voteAccused].isSpy;
      if (isSpy) {
        endGame(false, `Operative ${state.players[state.voteAccused].name} was successfully identified as the Spy!`);
      } else {
        endGame(true, `Innocent Operative ${state.players[state.voteAccused].name} was wrongly executed. The Spy wins!`);
      }
    } else {
      gameplayLog(`Accusation rejected. Verdict: INNOCENT (${innocentCount}/${totalVoters} votes). Resuming transmission.`, "system");
      resumeLocalGameplay();
    }
  }, 2000);
}

function forceEndgameVote() {
  state.gamePhase = "voting";
  const votes = {};
  state.players.forEach(p => votes[p.id] = 0);
  
  state.players.forEach(voter => {
    if (voter.isSpy) {
      const agents = state.players.filter(p => !p.isSpy);
      const target = agents[Math.floor(Math.random() * agents.length)];
      if (target) votes[target.id]++;
    } else {
      let maxSus = -1;
      let maxId = -1;
      Object.keys(voter.suspicion).forEach(id => {
        if (voter.suspicion[id] > maxSus) {
          maxSus = voter.suspicion[id];
          maxId = parseInt(id);
        }
      });
      if (maxId !== -1) votes[maxId]++;
    }
  });

  let highestId = 0;
  let highestVal = -1;
  Object.keys(votes).forEach(id => {
    if (votes[id] > highestVal) {
      highestVal = votes[id];
      highestId = parseInt(id);
    }
  });

  const accused = state.players[highestId];
  gameplayLog(`TIME EXPIRED. Security staff accused ${accused.name} by voting consensus.`, "error");

  const isSpy = accused.isSpy;
  if (isSpy) {
    endGame(false, `Consensus successfully identified the Spy ${accused.name}!`);
  } else {
    endGame(true, `Consensus executed innocent Agent ${accused.name}. The Spy ${state.spyPlayer.name} wins!`);
  }
}

function resumeLocalGameplay() {
  state.gamePhase = "gameplay";
  startLocalTimer();
  startTurn();
}

// 17. LOCAL GUESS SPY TARGETS
function triggerSpyGuessPhase() {
  DOM.modalGuess.classList.remove("hidden");
  
  let gridHTML = "";
  LOCATIONS.forEach(loc => {
    gridHTML += `
      <button class="guess-btn font-orbitron local-guess-btn" data-loc-id="${loc.id}">
        ${loc.name.toUpperCase()}
      </button>
    `;
  });
  DOM.spyGuessList.innerHTML = gridHTML;

  document.querySelectorAll(".local-guess-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const locId = btn.getAttribute("data-loc-id");
      const locObj = LOCATIONS.find(l => l.id === locId);
      
      DOM.modalGuess.classList.add("hidden");
      gameplayLog(`SPY DECLARED COVERT GUESS: ${locObj.name.toUpperCase()}`, "error", state.spyPlayer);
      
      setTimeout(() => {
        const correct = (locId === state.secretLocation.id);
        if (correct) {
          endGame(true, `Spy successfully guessed the secret location (${locObj.name})!`);
        } else {
          endGame(false, `Spy guessed the location incorrectly (${locObj.name}).`);
        }
      }, 1200);
    });
  });
}

// 18. GAME OVER WRAPPERS
function endGame(spyWins, reason) {
  clearInterval(state.timerInterval);
  switchView("gameover");
  
  if (spyWins) {
    DOM.gameoverOutcome.innerText = "SYSTEM COMPROMISED";
    DOM.gameoverOutcome.className = "gameover-banner font-orbitron lose";
    sfx.playLose();
  } else {
    DOM.gameoverOutcome.innerText = "MISSION ACCOMPLISHED";
    DOM.gameoverOutcome.className = "gameover-banner font-orbitron win";
    sfx.playWin();
  }

  DOM.debriefLocation.innerText = state.secretLocation.name.toUpperCase();
  DOM.debriefSpy.innerText = state.spyPlayer.name.toUpperCase();
  
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  DOM.debriefTime.innerText = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")} MIN`;
  DOM.debriefWinReason.innerText = reason.toUpperCase();

  let playersListHTML = "";
  state.players.forEach(p => {
    let roleText = p.isSpy ? "SPY" : `AGENT (${p.role})`;
    let cardClass = p.isSpy ? "debrief-player-card is-spy" : "debrief-player-card";
    
    let susText = "";
    if (p.isSpy) {
      let totalSus = 0;
      let count = 0;
      state.players.forEach(observer => {
        if (!observer.isSpy && observer.id !== p.id) {
          totalSus += observer.suspicion[p.id] || 0;
          count++;
        }
      });
      susText = `AVG SUSPICION: ${count > 0 ? Math.round(totalSus / count) : 0}%`;
    } else {
      const susOfSpy = p.suspicion[state.spyPlayer.id] || 0;
      susText = p.isAI ? `SUSPICION OF SPY: ${susOfSpy}%` : "HUMAN";
    }

    playersListHTML += `
      <div class="${cardClass}">
        <div class="player-meta">
          <span class="player-name-val">${p.name}</span>
          <span class="player-role-val font-mono">${roleText.toUpperCase()}</span>
        </div>
        <span class="player-sus-val font-mono text-cyan">${susText}</span>
      </div>
    `;
  });
  DOM.debriefPlayersList.innerHTML = playersListHTML;

  let logsHTML = "";
  if (state.aiReasoningLogs.length === 0) {
    logsHTML = `<div class="ai-logs-row text-muted">[NO AI PARTICIPATED IN THIS ROUND]</div>`;
  } else {
    state.aiReasoningLogs.forEach(logObj => {
      logsHTML += `
        <div class="ai-logs-row">
          <strong class="text-cyan">${logObj.player}:</strong> ${logObj.log}
        </div>
      `;
    });
  }
  DOM.aiLogsContent.innerHTML = logsHTML;
}

// 19. CORE UI PRINT HELPER
function gameplayLog(message, type = "msg", sender = null) {
  const row = document.createElement("div");
  row.className = `log-row ${type}`;
  
  const timeSpan = document.createElement("span");
  timeSpan.className = "log-time";
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const min = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const sec = (elapsed % 60).toString().padStart(2, "0");
  timeSpan.innerText = `[${min}:${sec}]`;
  row.appendChild(timeSpan);

  if (sender) {
    const senderSpan = document.createElement("span");
    senderSpan.className = `log-sender ${sender.isSpy ? 'spy' : 'agent'}`;
    senderSpan.innerText = `${sender.name}: `;
    row.appendChild(senderSpan);
  }

  const textSpan = document.createElement("span");
  textSpan.innerText = message;
  row.appendChild(textSpan);

  sfx.playType();
  DOM.terminalLog.appendChild(row);
  DOM.terminalLog.scrollTop = DOM.terminalLog.scrollHeight;
}

function updateTimerUI() {
  const min = Math.floor(state.timerRemaining / 60).toString().padStart(2, "0");
  const sec = (state.timerRemaining % 60).toString().padStart(2, "0");
  DOM.gameTimer.innerText = `${min}:${sec}`;

  if (state.timerRemaining < 30) {
    DOM.gameTimer.classList.add("blinking-low");
    if (state.timerRemaining > 0) {
      if (state.timerRemaining % 2 === 0) {
        sfx.playAlarm();
      } else {
        sfx.playTick();
      }
    }
  } else {
    DOM.gameTimer.classList.remove("blinking-low");
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

window.addEventListener("DOMContentLoaded", init);
