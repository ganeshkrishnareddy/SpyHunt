/* ==========================================
   SPY HUNT: WEBSOCKET SIGNALING SERVER (server.js)
   ========================================== */

const { WebSocketServer } = require('ws');
const http = require('http');

const PORT = 8082;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Spy Hunt Signaling Server Running\n');
});

const wss = new WebSocketServer({ server });

// Active Rooms database
const rooms = {};

// Helper: Generate a unique 4-letter room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

// Helper: Broadcast to all clients in a room
function broadcastToRoom(roomCode, data) {
  const room = rooms[roomCode];
  if (!room) return;

  const msg = JSON.stringify(data);
  room.clients.forEach(c => {
    if (!c.isAI && c.socket && c.socket.readyState === 1) {
      c.socket.send(msg);
    }
  });
}

// Helper: Send to a specific player
function sendToPlayer(player, data) {
  if (!player.isAI && player.socket && player.socket.readyState === 1) {
    player.socket.send(JSON.stringify(data));
  }
}

wss.on('connection', (ws) => {
  let clientRoomCode = null;
  let clientPlayerId = null;

  console.log('[Net] Client connected.');

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      
      switch (msg.type) {
        case 'create_room': {
          const code = generateRoomCode();
          clientRoomCode = code;
          clientPlayerId = 0;

          rooms[code] = {
            code: code,
            state: 'lobby', // lobby, playing, voting, gameover
            hostId: 0,
            clients: [{
              id: 0,
              name: msg.playerName,
              isAI: false,
              socket: ws,
              role: null,
              isSpy: false,
              suspicion: {},
              spyProbs: {}
            }],
            settings: {
              totalPlayers: 4,
              timerDuration: 180
            },
            gameState: {
              timerRemaining: 0,
              activePlayerIdx: 0,
              lastQuestionTargetIdx: null,
              logs: [],
              secretLocationId: null,
              secretLocationName: null,
              spyPlayerId: null,
              timerInterval: null
            },
            votes: {}, // voterId -> 'guilty' | 'innocent'
            voteAccuser: null,
            voteAccused: null
          };

          ws.send(JSON.stringify({
            type: 'room_created',
            roomCode: code,
            playerId: 0
          }));

          sendLobbyUpdate(code);
          console.log(`[Room] Created room ${code} by ${msg.playerName}`);
          break;
        }

        case 'join_room': {
          const code = msg.roomCode.toUpperCase();
          const room = rooms[code];

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
            return;
          }
          if (room.state !== 'lobby') {
            ws.send(JSON.stringify({ type: 'error', message: 'Game has already started in this room.' }));
            return;
          }
          if (room.clients.filter(c => !c.isAI).length >= room.settings.totalPlayers) {
            ws.send(JSON.stringify({ type: 'error', message: 'Lobby is full.' }));
            return;
          }

          const newId = room.clients.length;
          clientRoomCode = code;
          clientPlayerId = newId;

          room.clients.push({
            id: newId,
            name: msg.playerName,
            isAI: false,
            socket: ws,
            role: null,
            isSpy: false,
            suspicion: {},
            spyProbs: {}
          });

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomCode: code,
            playerId: newId,
            totalPlayers: room.settings.totalPlayers
          }));

          sendLobbyUpdate(code);
          console.log(`[Room] Player ${msg.playerName} joined room ${code}`);
          break;
        }

        case 'update_settings': {
          const room = rooms[clientRoomCode];
          if (!room || room.hostId !== clientPlayerId) return;

          room.settings.totalPlayers = msg.totalPlayers;
          room.settings.timerDuration = msg.timerDuration;
          
          broadcastToRoom(clientRoomCode, {
            type: 'settings_updated',
            settings: room.settings
          });
          break;
        }

        case 'start_game': {
          const room = rooms[clientRoomCode];
          if (!room || room.hostId !== clientPlayerId) return;

          room.state = 'playing';
          room.gameState.secretLocationId = msg.secretLocationId;
          room.gameState.secretLocationName = msg.secretLocationName;
          
          // Construct the final players array (Human + AI padding)
          const finalPlayers = [];
          
          // 1. Copy connected humans
          room.clients.forEach(c => {
            finalPlayers.push(c);
          });

          // 2. Pad remaining spots with AI
          const currentHumans = finalPlayers.length;
          const totalRequired = room.settings.totalPlayers;
          const aiNames = ["Agent Helix", "Cipher", "Spectre", "Shadow", "Wasp", "Oracle", "Apex", "Ghost"];
          let aiAdded = 0;

          for (let i = currentHumans; i < totalRequired; i++) {
            finalPlayers.push({
              id: i,
              name: aiNames[aiAdded % aiNames.length],
              isAI: true,
              socket: null,
              role: null,
              isSpy: false,
              suspicion: {},
              spyProbs: {}
            });
            aiAdded++;
          }

          // Assign roles sent by the host (host calculates roles to ensure sync with database)
          msg.assignments.forEach(assign => {
            const p = finalPlayers.find(pl => pl.id === assign.id);
            if (p) {
              p.role = assign.role;
              p.isSpy = assign.isSpy;
              if (assign.isSpy) {
                room.gameState.spyPlayerId = p.id;
              }
            }
          });

          // Overwrite clients array to include padded AI
          room.clients = finalPlayers;

          // Broadcast individualized starts (prevent players from intercepting others' roles)
          room.clients.forEach(p => {
            if (p.isAI) return;
            
            // Build safe players list (hide secret roles for others!)
            const safePlayers = room.clients.map(other => ({
              id: other.id,
              name: other.name,
              isAI: other.isAI
            }));

            sendToPlayer(p, {
              type: 'game_started',
              roomCode: room.code,
              playerId: p.id,
              players: safePlayers,
              secretLocationName: p.isSpy ? null : room.gameState.secretLocationName,
              role: p.role,
              isSpy: p.isSpy,
              timerDuration: room.settings.timerDuration
            });
          });

          // Initialize game state variables
          room.gameState.timerRemaining = room.settings.timerDuration;
          room.gameState.activePlayerIdx = 0;
          room.gameState.lastQuestionTargetIdx = null;
          room.gameState.logs = [{ text: 'NEURAL ENCRYPTION SYNCED. ONLINE SESSION START.', type: 'system' }];

          broadcastGameState(room.code);
          startServerTimer(room.code);
          console.log(`[Room] Game started in ${room.code}. Location: ${room.gameState.secretLocationName}`);
          break;
        }

        case 'ask_question': {
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'playing') return;

          const asker = room.clients.find(c => c.id === clientPlayerId);
          const target = room.clients.find(c => c.id === msg.targetId);

          if (!asker || !target) return;

          // Add log
          const logMsg = `asked ${target.name}: "${msg.questionText}"`;
          room.gameState.logs.push({ text: logMsg, type: 'action', senderId: asker.id });
          room.gameState.lastQuestionTargetIdx = asker.id;
          room.gameState.activePlayerIdx = target.id;

          // If target is AI, compute AI response immediately (AI responses are triggered by host or client, here client triggers it or sends it back)
          // In online mode, we wait for target client to respond. If AI, the host client will handle AI computation.
          broadcastGameState(room.code);
          break;
        }

        case 'submit_answer': {
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'playing') return;

          const responder = room.clients.find(c => c.id === clientPlayerId);
          if (!responder) return;

          const logMsg = `answered: "${msg.answerText}"`;
          room.gameState.logs.push({ text: logMsg, type: 'msg', senderId: responder.id });

          // Forward answer reasoning triggers: notify all AI observers
          // To evaluate suspicion / spy logs across tabs, we broadcast the answer details
          broadcastToRoom(room.code, {
            type: 'answer_submitted_event',
            responderId: responder.id,
            questionId: msg.questionId,
            answerText: msg.answerText,
            responseType: msg.responseType
          });

          // Transfer active turn
          room.gameState.activePlayerIdx = responder.id;
          broadcastGameState(room.code);
          break;
        }

        case 'ai_action': {
          // Received from the host when an AI takes an action (asking or answering)
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'playing') return;

          if (msg.action === 'ask') {
            const asker = room.clients.find(c => c.id === msg.askerId);
            const target = room.clients.find(c => c.id === msg.targetId);
            room.gameState.logs.push({ text: `asked ${target.name}: "${msg.questionText}"`, type: 'action', senderId: asker.id });
            room.gameState.lastQuestionTargetIdx = asker.id;
            room.gameState.activePlayerIdx = target.id;
          } else if (msg.action === 'answer') {
            const responder = room.clients.find(c => c.id === msg.responderId);
            room.gameState.logs.push({ text: `answered: "${msg.answerText}"`, type: 'msg', senderId: responder.id });
            
            // Forward AI answer event for suspicion mapping
            broadcastToRoom(room.code, {
              type: 'answer_submitted_event',
              responderId: responder.id,
              questionId: msg.questionId,
              answerText: msg.answerText,
              responseType: 'ai'
            });

            room.gameState.activePlayerIdx = responder.id;
          }

          broadcastGameState(room.code);
          break;
        }

        case 'accuse': {
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'playing') return;

          const accuser = room.clients.find(c => c.id === clientPlayerId);
          const accused = room.clients.find(c => c.id === msg.accusedId);

          if (!accuser || !accused) return;

          // Pause game state
          room.state = 'voting';
          pauseServerTimer(room.code);

          room.voteAccuser = accuser.id;
          room.voteAccused = accused.id;
          room.votes = {};
          room.votes[accuser.id] = 'guilty'; // Accuser automatically votes guilty

          room.gameState.logs.push({ text: `called an emergency accusation against ${accused.name}!`, type: 'error', senderId: accuser.id });

          broadcastToRoom(room.code, {
            type: 'voting_start',
            accuserId: accuser.id,
            accusedId: accused.id,
            votesCast: room.votes
          });
          break;
        }

        case 'submit_vote': {
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'voting') return;

          room.votes[clientPlayerId] = msg.vote;

          broadcastToRoom(room.code, {
            type: 'vote_updated',
            votesCast: room.votes
          });

          // Check if all votes are collected (excluding accused)
          const activeVoters = room.clients.filter(c => c.id !== room.voteAccused);
          const allVoted = activeVoters.every(v => room.votes[v.id] !== undefined);

          if (allVoted) {
            tallyVotes(room.code);
          }
          break;
        }

        case 'ai_submit_votes': {
          // Host client calculated AI votes and sends them in batch
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'voting') return;

          Object.keys(msg.aiVotes).forEach(aiId => {
            room.votes[aiId] = msg.aiVotes[aiId];
          });

          broadcastToRoom(room.code, {
            type: 'vote_updated',
            votesCast: room.votes
          });

          const activeVoters = room.clients.filter(c => c.id !== room.voteAccused);
          const allVoted = activeVoters.every(v => room.votes[v.id] !== undefined);

          if (allVoted) {
            tallyVotes(room.code);
          }
          break;
        }

        case 'spy_guess': {
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'playing') return;

          const player = room.clients.find(c => c.id === clientPlayerId);
          if (!player || !player.isSpy) return;

          clearInterval(room.gameState.timerInterval);
          room.state = 'gameover';
          
          const correct = (msg.locationId === room.gameState.secretLocationId);
          const logMsg = `declared location guess: ${msg.locationName.toUpperCase()}`;
          room.gameState.logs.push({ text: logMsg, type: 'error', senderId: player.id });

          const outcomeReason = correct 
            ? `${player.name} (Spy) successfully guessed the location.`
            : `${player.name} (Spy) guessed the location incorrectly (${msg.locationName}).`;

          endOnlineGame(room.code, correct, outcomeReason);
          break;
        }

        case 'ai_spy_guess': {
          const room = rooms[clientRoomCode];
          if (!room || room.state !== 'playing') return;

          clearInterval(room.gameState.timerInterval);
          room.state = 'gameover';

          const aiSpy = room.clients.find(c => c.id === msg.spyId);
          const correct = (msg.locationId === room.gameState.secretLocationId);

          const logMsg = `REVEALED ID AS THE SPY & guessed location: ${msg.locationName.toUpperCase()}`;
          room.gameState.logs.push({ text: logMsg, type: 'error', senderId: aiSpy.id });

          const outcomeReason = correct 
            ? `${aiSpy.name} (Spy Bot) successfully deduced the location.`
            : `${aiSpy.name} (Spy Bot) guessed the location incorrectly (${msg.locationName}).`;

          endOnlineGame(room.code, correct, outcomeReason);
          break;
        }

        case 'ai_log': {
          // Accumulate reasoning logs from client turns to show in debrief
          const room = rooms[clientRoomCode];
          if (!room) return;
          broadcastToRoom(room.code, {
            type: 'ai_log_broadcast',
            logObj: msg.logObj
          });
          break;
        }
      }
    } catch (e) {
      console.error('[Net] Error parsing client message:', e);
    }
  });

  ws.on('close', () => {
    console.log('[Net] Client disconnected.');
    if (clientRoomCode && rooms[clientRoomCode]) {
      const room = rooms[clientRoomCode];
      
      // Remove client
      room.clients = room.clients.filter(c => c.id !== clientPlayerId);
      
      if (room.clients.filter(c => !c.isAI).length === 0) {
        // Clean up empty room
        clearInterval(room.gameState.timerInterval);
        delete rooms[clientRoomCode];
        console.log(`[Room] Room ${clientRoomCode} deleted (no humans remain).`);
      } else {
        // If host disconnected, reassign host
        if (room.hostId === clientPlayerId) {
          const newHost = room.clients.find(c => !c.isAI);
          if (newHost) {
            room.hostId = newHost.id;
            console.log(`[Room] Reassigned host of ${clientRoomCode} to ${newHost.name}`);
          }
        }
        
        if (room.state === 'lobby') {
          sendLobbyUpdate(clientRoomCode);
        } else {
          // If a player disconnects mid-game, alert room
          room.gameState.logs.push({ text: `OPERATIVE DISCONNECT ERROR. MISSION STATUS UNSTABLE.`, type: 'error' });
          broadcastGameState(clientRoomCode);
        }
      }
    }
  });
});

// Lobby broadcast
function sendLobbyUpdate(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const playerNames = room.clients.map(c => c.name);
  broadcastToRoom(roomCode, {
    type: 'room_lobby',
    roomCode: roomCode,
    players: playerNames,
    hostId: room.hostId,
    settings: room.settings
  });
}

// Game State broadcast
function broadcastGameState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  broadcastToRoom(roomCode, {
    type: 'game_state',
    timerRemaining: room.gameState.timerRemaining,
    activePlayerIdx: room.gameState.activePlayerIdx,
    lastQuestionTargetIdx: room.gameState.lastQuestionTargetIdx,
    logs: room.gameState.logs,
    gameStatePhase: room.state
  });
}

// Room timer management
function startServerTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  clearInterval(room.gameState.timerInterval);
  room.gameState.timerInterval = setInterval(() => {
    room.gameState.timerRemaining--;
    
    // Broadcast timer tick to clients
    broadcastToRoom(roomCode, {
      type: 'timer_tick',
      timerRemaining: room.gameState.timerRemaining
    });

    if (room.gameState.timerRemaining <= 0) {
      clearInterval(room.gameState.timerInterval);
      handleTimerExpiration(roomCode);
    }
  }, 1000);
}

function pauseServerTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  clearInterval(room.gameState.timerInterval);
}

function handleTimerExpiration(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.state = 'gameover';
  // Compute consensus vote automatically:
  // For online mode, the easiest is to just end game with Spy Win since timer ran out!
  room.gameState.logs.push({ text: `TIMER EXPIRED. Operative security systems triggered quarantine. Spy wins!`, type: 'error' });
  endOnlineGame(roomCode, true, 'Timer expired. Agents failed to identify the Spy in time.');
}

function tallyVotes(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  let guiltyCount = 0;
  let innocentCount = 0;
  
  // Count votes
  room.clients.forEach(p => {
    if (p.id !== room.voteAccused) {
      if (room.votes[p.id] === 'guilty') guiltyCount++;
      else innocentCount++;
    }
  });

  const totalVoters = room.settings.totalPlayers - 1;
  const majorityNeeded = Math.ceil(totalVoters / 2 + 0.1);

  broadcastToRoom(roomCode, {
    type: 'voting_result',
    guiltyCount,
    innocentCount,
    votesCast: room.votes
  });

  setTimeout(() => {
    if (guiltyCount >= majorityNeeded) {
      // Accused executed!
      room.state = 'gameover';
      const accused = room.clients.find(c => c.id === room.voteAccused);
      const correct = accused.isSpy;
      
      const logText = `executed ${accused.name} by majority consensus (${guiltyCount}/${totalVoters} votes).`;
      room.gameState.logs.push({ text: logText, type: 'error' });

      if (correct) {
        endOnlineGame(roomCode, false, `Operative ${accused.name} was successfully identified as the Spy!`);
      } else {
        endOnlineGame(roomCode, true, `Innocent Operative ${accused.name} was wrongly executed. The Spy wins!`);
      }
    } else {
      // Resuming
      room.state = 'playing';
      const accused = room.clients.find(c => c.id === room.voteAccused);
      room.gameState.logs.push({ text: `Accusation against ${accused.name} failed. Resuming gameplay.`, type: 'system' });
      
      broadcastToRoom(roomCode, { type: 'voting_resume' });
      broadcastGameState(roomCode);
      startServerTimer(roomCode);
    }
  }, 2000);
}

function endOnlineGame(roomCode, spyWins, reason) {
  const room = rooms[roomCode];
  if (!room) return;

  room.state = 'gameover';
  clearInterval(room.gameState.timerInterval);

  // Send complete breakdown including secret location and roles
  const playerDossiers = room.clients.map(p => ({
    id: p.id,
    name: p.name,
    isAI: p.isAI,
    isSpy: p.isSpy,
    role: p.role
  }));

  broadcastToRoom(roomCode, {
    type: 'game_over_broadcast',
    spyWins: spyWins,
    reason: reason,
    secretLocationName: room.gameState.secretLocationName,
    spyName: room.clients.find(c => c.isSpy).name,
    playersBreakdown: playerDossiers
  });
}

server.listen(PORT, () => {
  console.log(`[Net] Multiplayer signaling server running on port ${PORT}`);
});
