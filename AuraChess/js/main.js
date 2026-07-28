import { getPieceSVG } from './pieces.js';
import { StorageManager } from './storage.js';

// Sound system using Web Audio API (no asset dependencies)
const ChessSounds = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  toggle(state) {
    this.enabled = state !== undefined ? state : !this.enabled;
    return this.enabled;
  },

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  },

  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Noise buffer for snap sound
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  },

  playCheck() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc1.frequency.setValueAtTime(520, this.ctx.currentTime + 0.08);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(404, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(525, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.25);
    osc2.stop(this.ctx.currentTime + 0.25);
  },

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 0.4 + idx * 0.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.7);
    });
  },

  playLoss() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const notes = [220.00, 196.00, 174.61, 146.83]; // A3, G3, F3, D3

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.8);
    });
  }
};

// Opponent Personas mapped to Elo bands
const OPPONENTS = [
  {
    name: 'Sparky 🐶',
    elo: 400,
    title: 'Beginner (Puppy)',
    avatar: '🐶',
    description: 'Just loves chasing pieces! Prone to happy little blunders.',
    dialogues: {
      intro: 'Woof! Let’s play! Can I chew on a pawn?',
      win: 'Bow wow! I got a treat!',
      loss: 'Aww, *whimper*. Good game!',
      check: 'Bark! You’re chasing me!'
    }
  },
  {
    name: 'Oliver 🧑‍💼',
    elo: 800,
    title: 'Beginner (Casual Clubber)',
    avatar: '🧑‍💼',
    description: 'Plays chess on his lunch break. Solid starter, but loses focus sometimes.',
    dialogues: {
      intro: 'Hey there! Nice to meet you. Let’s fit a game in before my meeting.',
      win: 'Haha, that lunch coffee kicked in!',
      loss: 'Ah, missed that fork. Back to spreadsheets I guess.',
      check: 'Whoa! Nice check there.'
    }
  },
  {
    name: 'Sophia 🎓',
    elo: 1200,
    title: 'Intermediate (Tactical Student)',
    avatar: '🎓',
    description: 'Studies puzzle rushes daily. Likes tactical traps but overlooks positional planning.',
    dialogues: {
      intro: 'Hi! Let’s see how well you handle tactical pressure.',
      win: 'Gotcha! That tactic worked perfectly.',
      loss: 'A solid positional squeeze... I need to read more Capablanca.',
      check: 'Check! How do you escape this?'
    }
  },
  {
    name: 'Marcus 🏆',
    elo: 1600,
    title: 'Advanced (Club Champion)',
    avatar: '🏆',
    description: 'Very strong positional player. Punishes blunders and controls key diagonals.',
    dialogues: {
      intro: 'Welcome to the club. Let’s play a professional, clean game.',
      win: 'Control of the open file was the deciding factor here.',
      loss: 'Incredibly precise play. You deserved the victory.',
      check: 'Check. You must defend.'
    }
  },
  {
    name: 'Aurora 👑',
    elo: 2000,
    title: 'Pro (Grandmaster)',
    avatar: '👑',
    description: 'Calculates deep lines. Combines sharp tactical threats with ironclad endgame technique.',
    dialogues: {
      intro: 'The board holds no secrets. Let us play.',
      win: 'A beautiful struggle, but chess is ultimately logical.',
      loss: 'Extraordinary. You calculated with grandmaster precision.',
      check: 'Check. Choose your path wisely.'
    }
  },
  {
    name: 'DeepThought 💻',
    elo: 2400,
    title: 'Master (AI Overlord)',
    avatar: '💻',
    description: 'The supercomputer engine. Searches thousands of paths. Virtually flawless.',
    dialogues: {
      intro: 'Analyzing neural pathways... commencing game sequence.',
      win: 'Calculation sequence successful. Victory achieved.',
      loss: 'Error: defeat detected. Commencing code optimization sweep.',
      check: 'Threat index elevated. King in check.'
    }
  }
];

// App State Management
class ChessApp {
  constructor() {
    this.game = new Chess();
    this.aiWorker = null;
    
    // UI selections
    this.selectedSquare = null;
    this.playerColor = 'w'; // White player by default
    this.autoScaleOpponent = true;
    this.selectedOpponentIndex = 1; // Oliver by default
    
    // Promotion flow helpers
    this.pendingPromotionMove = null;

    // Dom elements
    this.elements = {};
    
    // Initialize AI worker
    this.initWorker();
  }

  initWorker() {
    try {
      this.aiWorker = new Worker('./js/ai-worker.js');
      this.aiWorker.onmessage = (e) => this.handleAIMessage(e);
    } catch (err) {
      console.error('Failed to initialize Web Worker. Running in fallback mode.', err);
    }
  }

  boot() {
    this.cacheDOMElements();
    this.bindEvents();
    this.loadStateFromStorage();
    this.updateOpponentSelection();
    this.resetBoard();
    this.updateStatsDisplay();
    
    // Inject the new Chess.com-style pieces into promotion options
    this.elements.promoQueen.innerHTML = getPieceSVG('q', 'w');
    this.elements.promoRook.innerHTML = getPieceSVG('r', 'w');
    this.elements.promoBishop.innerHTML = getPieceSVG('b', 'w');
    this.elements.promoKnight.innerHTML = getPieceSVG('n', 'w');
  }

  cacheDOMElements() {
    this.elements = {
      boardGrid: document.getElementById('board-grid'),
      playerEloDisplay: document.getElementById('player-elo') || document.getElementById('player-bar-elo'),
      playerProfileElo: document.getElementById('profile-elo'),
      playerProfileAvatar: document.getElementById('profile-avatar'),
      
      oppSelect: document.getElementById('opp-select'),
      oppTitle: document.getElementById('opp-title'),
      oppAvatar: document.getElementById('opp-avatar'),
      oppDesc: document.getElementById('opp-desc'),
      oppDialogue: document.getElementById('opp-dialogue'),
      oppBarName: document.getElementById('opp-bar-name'),
      oppBarElo: document.getElementById('opp-bar-elo'),
      oppBarAvatar: document.getElementById('opp-bar-avatar'),
      oppCaptured: document.getElementById('opp-captured'),
      
      playerBarName: document.getElementById('player-bar-name'),
      playerBarElo: document.getElementById('player-bar-elo'),
      playerCaptured: document.getElementById('player-captured'),
      
      computerBar: document.getElementById('computer-bar'),
      userBar: document.getElementById('user-bar'),
      
      movesLog: document.getElementById('moves-log'),
      btnNewGame: document.getElementById('btn-new'),
      btnResign: document.getElementById('btn-resign'),
      btnDraw: document.getElementById('btn-draw'),
      btnUndo: document.getElementById('btn-undo'),
      btnResetStats: document.getElementById('btn-reset-stats'),
      
      toggleSound: document.getElementById('toggle-sound'),
      toggleCoords: document.getElementById('toggle-coords'),
      toggleHints: document.getElementById('toggle-hints'),
      toggleScale: document.getElementById('toggle-scale'),
      
      statusOverlay: document.getElementById('status-overlay'),
      statusIcon: document.getElementById('status-icon'),
      statusTitle: document.getElementById('status-title'),
      statusMessage: document.getElementById('status-message'),
      statusEloDelta: document.getElementById('status-elo-delta'),
      btnCloseStatus: document.getElementById('btn-close-status'),
      
      promotionDialog: document.getElementById('promotion-dialog'),
      promoQueen: document.getElementById('promo-q'),
      promoRook: document.getElementById('promo-r'),
      promoBishop: document.getElementById('promo-b'),
      promoKnight: document.getElementById('promo-n'),
      
      // Tabs
      tabHistory: document.getElementById('tab-history'),
      tabStats: document.getElementById('tab-stats'),
      contentHistory: document.getElementById('content-history'),
      contentStats: document.getElementById('content-stats'),
      
      // Stats fields
      statWins: document.getElementById('stat-wins'),
      statLosses: document.getElementById('stat-losses'),
      statDraws: document.getElementById('stat-draws'),
      statTotal: document.getElementById('stat-total'),
      historyList: document.getElementById('history-list')
    };
  }

  bindEvents() {
    // New Game and controls
    this.elements.btnNewGame.addEventListener('click', () => this.startNewGame());
    this.elements.btnResign.addEventListener('click', () => this.resignGame());
    this.elements.btnDraw.addEventListener('click', () => this.offerDraw());
    this.elements.btnUndo.addEventListener('click', () => this.undoMove());
    this.elements.btnResetStats.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your ELO and match history?')) {
        StorageManager.clearHistory();
        this.loadStateFromStorage();
        this.updateOpponentSelection();
        this.updateStatsDisplay();
        this.startNewGame();
        this.showToast('Stats reset to defaults.');
      }
    });

    // Opponent selection
    this.elements.oppSelect.addEventListener('change', (e) => {
      this.selectedOpponentIndex = parseInt(e.target.value, 10);
      this.autoScaleOpponent = false;
      this.elements.toggleScale.classList.remove('active');
      this.updateOpponentSelection();
      this.startNewGame();
    });

    // HUD settings triggers
    this.elements.toggleSound.addEventListener('click', () => {
      const active = ChessSounds.toggle();
      this.elements.toggleSound.classList.toggle('active', active);
      StorageManager.saveSettings({ soundEnabled: active });
      this.showToast(active ? 'Sound effects enabled' : 'Sound muted');
    });

    this.elements.toggleCoords.addEventListener('click', () => {
      const show = !this.elements.toggleCoords.classList.contains('active');
      this.elements.toggleCoords.classList.toggle('active', show);
      StorageManager.saveSettings({ showCoordinates: show });
      this.renderBoard();
      this.showToast(show ? 'Coordinates visible' : 'Coordinates hidden');
    });

    this.elements.toggleHints.addEventListener('click', () => {
      const active = !this.elements.toggleHints.classList.contains('active');
      this.elements.toggleHints.classList.toggle('active', active);
      StorageManager.saveSettings({ moveHints: active });
      this.clearHighlights();
      this.showToast(active ? 'Move guides enabled' : 'Move guides disabled');
    });

    this.elements.toggleScale.addEventListener('click', () => {
      this.autoScaleOpponent = !this.autoScaleOpponent;
      this.elements.toggleScale.classList.toggle('active', this.autoScaleOpponent);
      if (this.autoScaleOpponent) {
        this.scaleOpponentToPlayerElo();
        this.startNewGame();
      }
      this.showToast(this.autoScaleOpponent ? 'AI auto-scaling ON' : 'AI auto-scaling OFF');
    });

    // Overlays
    this.elements.btnCloseStatus.addEventListener('click', () => {
      this.elements.statusOverlay.classList.remove('active');
    });

    // Promotion selections
    this.elements.promoQueen.addEventListener('click', () => this.resolvePromotion('q'));
    this.elements.promoRook.addEventListener('click', () => this.resolvePromotion('r'));
    this.elements.promoBishop.addEventListener('click', () => this.resolvePromotion('b'));
    this.elements.promoKnight.addEventListener('click', () => this.resolvePromotion('n'));

    // Drag-and-drop board setup (event delegation)
    const boardGrid = this.elements.boardGrid;
    boardGrid.addEventListener('dragover', (e) => e.preventDefault());
    boardGrid.addEventListener('drop', (e) => this.handleDrop(e));

    // Tab buttons
    this.elements.tabHistory.addEventListener('click', () => this.switchTab('history'));
    this.elements.tabStats.addEventListener('click', () => this.switchTab('stats'));
  }

  loadStateFromStorage() {
    const elo = StorageManager.getPlayerElo();
    if (this.elements.playerEloDisplay) this.elements.playerEloDisplay.textContent = elo;
    if (this.elements.playerProfileElo) this.elements.playerProfileElo.textContent = elo;
    if (this.elements.playerBarElo) this.elements.playerBarElo.textContent = elo;

    // Load configurations
    const settings = StorageManager.getSettings();
    ChessSounds.toggle(settings.soundEnabled);
    this.elements.toggleSound.classList.toggle('active', settings.soundEnabled);
    this.elements.toggleCoords.classList.toggle('active', settings.showCoordinates);
    this.elements.toggleHints.classList.toggle('active', settings.moveHints);
    this.elements.toggleScale.classList.toggle('active', this.autoScaleOpponent);
    
    // Compute avatar initial
    this.elements.playerProfileAvatar.textContent = 'P';
    this.elements.playerBarName.textContent = 'Player';
  }

  switchTab(tab) {
    if (tab === 'history') {
      this.elements.tabHistory.classList.add('active');
      this.elements.tabStats.classList.remove('active');
      this.elements.contentHistory.classList.add('active');
      this.elements.contentStats.classList.remove('active');
    } else {
      this.elements.tabHistory.classList.remove('active');
      this.elements.tabStats.classList.add('active');
      this.elements.contentHistory.classList.remove('active');
      this.elements.contentStats.classList.add('active');
    }
  }

  updateStatsDisplay() {
    const history = StorageManager.getMatchHistory();
    const stats = { wins: 0, losses: 0, draws: 0 };
    
    history.forEach(rec => {
      if (rec.outcome === 'win') stats.wins++;
      else if (rec.outcome === 'loss') stats.losses++;
      else stats.draws++;
    });

    this.elements.statWins.textContent = stats.wins;
    this.elements.statLosses.textContent = stats.losses;
    this.elements.statDraws.textContent = stats.draws;
    this.elements.statTotal.textContent = history.length;

    // Render list
    this.elements.historyList.innerHTML = '';
    if (history.length === 0) {
      this.elements.historyList.innerHTML = `<div class="history-item">No games recorded yet.</div>`;
    } else {
      history.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        let outcomeClass = 'history-result-draw';
        let outcomeLabel = 'Draw';
        if (rec.outcome === 'win') {
          outcomeClass = 'history-result-win';
          outcomeLabel = 'Win';
        } else if (rec.outcome === 'loss') {
          outcomeClass = 'history-result-loss';
          outcomeLabel = 'Loss';
        }

        const date = new Date(rec.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        
        item.innerHTML = `
          <div class="history-item-details">
            <span class="history-item-opp">vs ${rec.opponentName} (${rec.opponentElo})</span>
            <span class="history-item-date">${date} • Color: ${rec.playerColor === 'w' ? 'White' : 'Black'}</span>
          </div>
          <span class="history-item-result ${outcomeClass}">${outcomeLabel} (${rec.eloDelta})</span>
        `;
        this.elements.historyList.appendChild(item);
      });
    }
  }

  scaleOpponentToPlayerElo() {
    if (!this.autoScaleOpponent) return;

    const elo = StorageManager.getPlayerElo();
    // Select the best fitting opponent
    let matchIdx = 0;
    for (let i = 0; i < OPPONENTS.length; i++) {
      if (elo >= OPPONENTS[i].elo) {
        matchIdx = i;
      }
    }
    this.selectedOpponentIndex = matchIdx;
    this.elements.oppSelect.value = matchIdx;
  }

  updateOpponentSelection() {
    const opp = OPPONENTS[this.selectedOpponentIndex];
    this.elements.oppTitle.textContent = opp.title;
    this.elements.oppAvatar.textContent = opp.avatar;
    this.elements.oppDesc.textContent = opp.description;
    this.elements.oppDialogue.textContent = `"${opp.dialogues.intro}"`;
    this.elements.oppBarName.textContent = opp.name;
    this.elements.oppBarElo.textContent = opp.elo;
    this.elements.oppBarAvatar.textContent = opp.avatar;
  }

  startNewGame() {
    this.game = new Chess();
    this.selectedSquare = null;
    this.pendingPromotionMove = null;
    
    // Scale if active
    if (this.autoScaleOpponent) {
      this.scaleOpponentToPlayerElo();
      this.updateOpponentSelection();
    }
    
    this.elements.statusOverlay.classList.remove('active');
    this.elements.promotionDialog.classList.remove('active');
    
    // Set dialogue intro
    const opp = OPPONENTS[this.selectedOpponentIndex];
    this.elements.oppDialogue.textContent = `"${opp.dialogues.intro}"`;
    
    this.resetBoard();
    this.updateUIActiveTurn();
    this.showToast('Game Started. Good luck!');
  }

  resetBoard() {
    this.renderBoard();
    this.updateMovesLog();
    this.updateCapturedPieces();
  }

  // Renders the board DOM completely
  renderBoard() {
    const grid = this.elements.boardGrid;
    grid.innerHTML = '';
    
    const boardState = this.game.board();
    const showCoordinates = this.elements.toggleCoords.classList.contains('active');
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    // If player plays Black, we invert the grid mapping (optional expansion)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareName = files[c] + ranks[r];
        const isLight = (r + c) % 2 === 0;
        
        const squareDiv = document.createElement('div');
        squareDiv.id = `sq-${squareName}`;
        squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;
        squareDiv.dataset.square = squareName;
        
        // Add coordinate text if setting is on
        if (showCoordinates) {
          if (r === 7) {
            const fileText = document.createElement('span');
            fileText.className = 'coordinate file';
            fileText.textContent = files[c];
            squareDiv.appendChild(fileText);
          }
          if (c === 0) {
            const rankText = document.createElement('span');
            rankText.className = 'coordinate rank';
            rankText.textContent = ranks[r];
            squareDiv.appendChild(rankText);
          }
        }
        
        // Piece logic
        const piece = boardState[r][c];
        if (piece) {
          const wrapper = document.createElement('div');
          wrapper.className = 'piece-wrapper';
          wrapper.draggable = piece.color === this.playerColor && this.game.turn() === this.playerColor;
          wrapper.dataset.square = squareName;
          wrapper.innerHTML = getPieceSVG(piece.type, piece.color);
          
          // Setup drag events
          wrapper.addEventListener('dragstart', (e) => this.handleDragStart(e));
          wrapper.addEventListener('dragend', (e) => this.handleDragEnd(e));
          wrapper.addEventListener('click', (e) => this.handlePieceClick(e, squareName));
          
          squareDiv.appendChild(wrapper);
        } else {
          // Setup click empty square
          squareDiv.addEventListener('click', (e) => this.handleSquareClick(squareName));
        }
        
        grid.appendChild(squareDiv);
      }
    }

    // Highlight checks
    if (this.game.in_check()) {
      const kingColor = this.game.turn();
      const kingSquare = this.findKingSquare(kingColor);
      if (kingSquare) {
        document.getElementById(`sq-${kingSquare}`)?.classList.add('in-check');
      }
    }
  }

  findKingSquare(color) {
    const boardState = this.game.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return files[c] + ranks[r];
        }
      }
    }
    return null;
  }

  // Interactivity handlers
  handleDragStart(e) {
    if (this.game.turn() !== this.playerColor) {
      e.preventDefault();
      return;
    }
    const sq = e.currentTarget.dataset.square;
    this.selectedSquare = sq;
    e.dataTransfer.setData('text/plain', sq);
    e.currentTarget.classList.add('dragging');
    
    this.showMoveHints(sq);
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
  }

  handleDrop(e) {
    e.preventDefault();
    if (this.game.turn() !== this.playerColor) return;

    let targetSq = e.target.closest('.square')?.dataset.square;
    if (!targetSq) return;

    const sourceSq = this.selectedSquare;
    if (sourceSq === targetSq) return;

    this.attemptMove(sourceSq, targetSq);
  }

  handlePieceClick(e, sq) {
    e.stopPropagation();
    if (this.game.turn() !== this.playerColor) return;
    
    const piece = this.game.get(sq);
    if (piece && piece.color === this.playerColor) {
      // Toggle select
      if (this.selectedSquare === sq) {
        this.selectedSquare = null;
        this.clearHighlights();
      } else {
        this.selectedSquare = sq;
        this.clearHighlights();
        document.getElementById(`sq-${sq}`)?.classList.add('selected');
        this.showMoveHints(sq);
      }
    } else if (this.selectedSquare) {
      // Attack move
      this.attemptMove(this.selectedSquare, sq);
    }
  }

  handleSquareClick(sq) {
    if (this.game.turn() !== this.playerColor || !this.selectedSquare) return;
    this.attemptMove(this.selectedSquare, sq);
  }

  showMoveHints(fromSq) {
    if (!this.elements.toggleHints.classList.contains('active')) return;

    const opp = OPPONENTS[this.selectedOpponentIndex];
    const isLearnersMode = opp.elo <= 1200;
    const mateMoves = isLearnersMode ? this.getCheckmateMoves() : [];

    const moves = this.game.moves({ square: fromSq, verbose: true });
    moves.forEach(m => {
      const sqDiv = document.getElementById(`sq-${m.to}`);
      if (sqDiv) {
        const indicator = document.createElement('div');
        
        // Check if this specific move delivers checkmate
        const isMateMove = mateMoves.some(mate => mate.from === fromSq && mate.to === m.to);
        
        if (isMateMove) {
          indicator.className = 'move-hint-mate';
          indicator.title = 'Checkmate Move!';
        } else {
          indicator.className = m.captured ? 'move-hint-capture' : 'move-hint';
        }
        
        sqDiv.appendChild(indicator);
      }
    });
  }

  clearHighlights() {
    // Remove selected state and hints
    const squares = this.elements.boardGrid.querySelectorAll('.square');
    squares.forEach(sq => {
      sq.classList.remove('selected');
      const hints = sq.querySelectorAll('.move-hint, .move-hint-capture, .move-hint-mate');
      hints.forEach(h => h.remove());
    });
  }

  attemptMove(from, to) {
    this.clearHighlights();
    
    // Check if move exists
    const moves = this.game.moves({ square: from, verbose: true });
    const match = moves.find(m => m.to === to);
    
    if (!match) {
      this.selectedSquare = null;
      return;
    }
    
    // Handle pawn promotion trigger
    if (match.promotion) {
      this.pendingPromotionMove = { from, to };
      this.elements.promotionDialog.classList.add('active');
      return;
    }

    // Execute Standard Move
    const isCapture = this.game.get(to) !== null || (match.flags && match.flags.includes('e')); // capture flag
    const result = this.game.move({ from, to });
    
    if (result) {
      this.selectedSquare = null;
      this.onMoveComplete(result, isCapture);
    }
  }

  resolvePromotion(pieceCode) {
    this.elements.promotionDialog.classList.remove('active');
    if (!this.pendingPromotionMove) return;

    const { from, to } = this.pendingPromotionMove;
    const isCapture = this.game.get(to) !== null;
    
    const result = this.game.move({ from, to, promotion: pieceCode });
    this.pendingPromotionMove = null;

    if (result) {
      this.onMoveComplete(result, isCapture);
    }
  }

  onMoveComplete(moveResult, isCapture) {
    // Sound FX
    if (this.game.in_check()) {
      ChessSounds.playCheck();
    } else if (isCapture) {
      ChessSounds.playCapture();
    } else {
      ChessSounds.playMove();
    }

    // Refresh display
    this.resetBoard();
    
    // Highlight last move squares
    document.getElementById(`sq-${moveResult.from}`)?.classList.add('last-move');
    document.getElementById(`sq-${moveResult.to}`)?.classList.add('last-move');

    // Check game state ending
    if (this.game.game_over()) {
      this.handleGameOver();
      return;
    }

    // Update trainer recommendation dialogues
    this.updateTrainerAlerts();

    // AI Turn trigger
    this.updateUIActiveTurn();
    if (this.game.turn() !== this.playerColor) {
      this.triggerComputerTurn();
    }
  }

  getCheckmateMoves() {
    const mateMoves = [];
    if (this.game.game_over()) return mateMoves;
    
    const moves = this.game.moves({ verbose: true });
    moves.forEach(m => {
      this.game.move(m);
      if (this.game.in_checkmate()) {
        mateMoves.push(m);
      }
      this.game.undo();
    });
    return mateMoves;
  }

  updateTrainerAlerts() {
    const opp = OPPONENTS[this.selectedOpponentIndex];
    const isLearnersMode = opp.elo <= 1200;

    if (isLearnersMode && this.game.turn() === this.playerColor) {
      const mateMoves = this.getCheckmateMoves();
      if (mateMoves.length > 0) {
        this.elements.oppDialogue.innerHTML = `<span style="color: var(--accent-gold); font-weight: 700;">💡 Trainer:</span> You can deliver Checkmate this turn! Click your pieces to find the winning move and prevent stalemate!`;
      }
    }
  }

  updateUIActiveTurn() {
    const isUserTurn = this.game.turn() === this.playerColor;
    this.elements.userBar.classList.toggle('active-turn', isUserTurn);
    this.elements.computerBar.classList.toggle('active-turn', !isUserTurn);
  }

  triggerComputerTurn() {
    if (!this.aiWorker) {
      // Fallback simple random AI if Web Worker failed
      setTimeout(() => {
        const moves = this.game.moves();
        if (moves.length > 0) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          const isCap = move.includes('x');
          const res = this.game.move(move);
          this.onMoveComplete(res, isCap);
        }
      }, 500);
      return;
    }

    const currentOpp = OPPONENTS[this.selectedOpponentIndex];
    this.aiWorker.postMessage({
      fen: this.game.fen(),
      playerElo: StorageManager.getPlayerElo(),
      aiColor: this.playerColor === 'w' ? 'b' : 'w'
    });
  }

  handleAIMessage(e) {
    const { bestMove, from, to, promotion } = e.data;
    if (!bestMove) return;

    // Safety check: Ignore AI move if player already clicked undo and it is player's turn
    if (this.game.turn() === this.playerColor) {
      console.log('Ignored worker move response because player undid their move.');
      return;
    }

    const isCapture = this.game.get(to) !== null || (this.game.get(from)?.type === 'p' && from[0] !== to[0] && this.game.get(to) === null); // en passant
    const res = this.game.move({ from, to, promotion });

    if (res) {
      // Change opponent dialogues on check
      const opp = OPPONENTS[this.selectedOpponentIndex];
      if (this.game.in_check()) {
        this.elements.oppDialogue.textContent = `"${opp.dialogues.check}"`;
      } else {
        // Random standard chatter occasionally
        if (Math.random() < 0.15) {
          this.elements.oppDialogue.textContent = `"${opp.description.slice(0, 40)}..."`;
        }
      }

      this.onMoveComplete(res, isCapture);
    }
  }

  undoMove() {
    const historyLength = this.game.history().length;
    if (historyLength === 0) {
      this.showToast('No moves to undo.');
      return;
    }

    if (this.game.turn() === this.playerColor) {
      // Both player and computer have moved, undo twice to revert to player's previous turn
      if (historyLength >= 2) {
        this.game.undo();
        this.game.undo();
      } else {
        this.game.undo();
      }
    } else {
      // Player made a move but computer hasn't responded yet, undo once
      this.game.undo();
    }

    this.selectedSquare = null;
    this.elements.statusOverlay.classList.remove('active');
    this.elements.promotionDialog.classList.remove('active');
    this.resetBoard();
    this.updateUIActiveTurn();
    this.updateTrainerAlerts();
    this.showToast('Move undone.');
  }

  resignGame() {
    console.log('resignGame() invoked');
    if (confirm('Are you sure you want to resign?')) {
      console.log('resignGame: confirmed');
      this.endGame('loss', 'You resigned the match.');

      // Force a UI/game reset after a short delay to ensure overlay and storage updates complete.
      setTimeout(() => {
        console.log('resignGame: performing forced reset');
        // Ensure overlays are hidden
        this.elements.statusOverlay.classList.remove('active');
        this.elements.promotionDialog.classList.remove('active');

        // Reset game state
        this.game = new Chess();
        this.selectedSquare = null;
        this.pendingPromotionMove = null;

        // Re-apply opponent scaling if enabled
        if (this.autoScaleOpponent) {
          this.scaleOpponentToPlayerElo();
          this.updateOpponentSelection();
        }

        // Refresh board and UI
        this.resetBoard();
        this.updateUIActiveTurn();
        this.showToast('Game reset after resignation.');
      }, 700);
    }
  }

  offerDraw() {
    const opp = OPPONENTS[this.selectedOpponentIndex];
    
    // Draw acceptance logic: AI accepts draw if player's rating is high, or simple randomness.
    // Pro AI Aurora & DeepThought won't accept easily unless drawish board. Sparky accepts immediately.
    let accepts = false;
    if (opp.elo <= 800) {
      accepts = true;
    } else if (opp.elo <= 1600) {
      accepts = Math.random() < 0.5;
    } else {
      accepts = Math.random() < 0.15; // Grandmaster/Computer rarely accepts
    }

    if (accepts) {
      alert(`${opp.name} accepted your draw offer!`);
      this.endGame('draw', 'Draw agreed by mutual agreement.');
    } else {
      alert(`${opp.name} declined the draw offer!`);
      this.elements.oppDialogue.textContent = '"I think my position is better. Let’s play on!"';
    }
  }

  handleGameOver() {
    let outcome = 'draw';
    let message = '';
    
    if (this.game.in_checkmate()) {
      const loserColor = this.game.turn();
      if (loserColor === this.playerColor) {
        outcome = 'loss';
        message = 'Checkmate! The machine has defeated you.';
      } else {
        outcome = 'win';
        message = 'Checkmate! You have defeated the machine!';
      }
    } else if (this.game.in_draw()) {
      outcome = 'draw';
      if (this.game.in_stalemate()) {
        message = 'Draw by stalemate! No legal moves remaining.';
      } else if (this.game.insufficient_material()) {
        message = 'Draw due to insufficient material.';
      } else {
        message = 'Draw by repetition or 50-move rule.';
      }
    }

    this.endGame(outcome, message);
  }

  endGame(outcome, message) {
    // Sound FX
    if (outcome === 'win') {
      ChessSounds.playWin();
    } else if (outcome === 'loss') {
      ChessSounds.playLoss();
    } else {
      ChessSounds.playMove();
    }

    const playerElo = StorageManager.getPlayerElo();
    const opp = OPPONENTS[this.selectedOpponentIndex];
    
    // Map outcome to score digit
    const scoreVal = outcome === 'win' ? 1 : (outcome === 'loss' ? 0 : 0.5);
    
    // Compute ELO adjustment
    const { newElo, delta } = StorageManager.calculateEloChange(playerElo, opp.elo, scoreVal);
    
    // Save to storage
    StorageManager.setPlayerElo(newElo);
    
    const record = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      opponentName: opp.name,
      opponentElo: opp.elo,
      playerColor: this.playerColor,
      outcome,
      playerEloBefore: playerElo,
      playerEloAfter: newElo,
      eloDelta: delta
    };
    StorageManager.addMatchRecord(record);

    // Update Opponent speech
    this.elements.oppDialogue.textContent = outcome === 'win' ? `"${opp.dialogues.loss}"` : (outcome === 'loss' ? `"${opp.dialogues.win}"` : '"Good game."');

    // Trigger overlay modal
    let icon = '🤝';
    if (outcome === 'win') icon = '🏆';
    if (outcome === 'loss') icon = '💀';
    
    this.elements.statusIcon.textContent = icon;
    this.elements.statusTitle.textContent = outcome === 'win' ? 'Victory!' : (outcome === 'loss' ? 'Defeat' : 'Draw Match');
    this.elements.statusMessage.textContent = message;
    this.elements.statusEloDelta.textContent = `ELO: ${playerElo} ➔ ${newElo} (${delta})`;
    this.elements.statusOverlay.classList.add('active');

    // Reload layout and statistics
    this.loadStateFromStorage();
    this.updateStatsDisplay();
  }

  // UI Updates helper
  updateMovesLog() {
    const history = this.game.history();
    const log = this.elements.movesLog;
    log.innerHTML = '';
    
    let rowHTML = '';
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = history[i];
      const blackMove = history[i + 1] || '';
      
      const row = document.createElement('div');
      row.className = 'move-row';
      row.innerHTML = `
        <span class="move-num">${moveNum}.</span>
        <span class="move-white">${whiteMove}</span>
        <span class="move-black">${blackMove}</span>
      `;
      log.appendChild(row);
    }
    
    // Autoscroll
    log.scrollTop = log.scrollHeight;
  }

  updateCapturedPieces() {
    const boardState = this.game.board();
    
    // Count remaining pieces
    const startCounts = {
      p: 8, n: 2, b: 2, r: 2, q: 1, k: 1
    };
    
    const wCounts = { p:0, n:0, b:0, r:0, q:0, k:0 };
    const bCounts = { p:0, n:0, b:0, r:0, q:0, k:0 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          if (piece.color === 'w') {
            wCounts[piece.type]++;
          } else {
            bCounts[piece.type]++;
          }
        }
      }
    }

    // Calc captures
    const wCaptured = [];
    const bCaptured = [];
    
    // Pieces captured by White (which means Black pieces missing)
    let whiteScoreDiff = 0;
    let blackScoreDiff = 0;

    const values = { p:1, n:3, b:3, r:5, q:9, k:0 };

    Object.keys(startCounts).forEach(type => {
      // White captures (Black pieces lost)
      const diffW = startCounts[type] - bCounts[type];
      for(let i=0; i<diffW; i++) {
        wCaptured.push({ type, color: 'b' });
        whiteScoreDiff += values[type];
      }

      // Black captures (White pieces lost)
      const diffB = startCounts[type] - wCounts[type];
      for(let i=0; i<diffB; i++) {
        bCaptured.push({ type, color: 'w' });
        blackScoreDiff += values[type];
      }
    });

    // Render lists
    this.renderCapturedList(this.elements.playerCaptured, wCaptured);
    this.renderCapturedList(this.elements.oppCaptured, bCaptured);

    // Show score lead tags
    const leadW = whiteScoreDiff - blackScoreDiff;
    if (leadW > 0) {
      this.elements.playerCaptured.insertAdjacentHTML('beforeend', `<span class="captured-score">+${leadW}</span>`);
    } else if (leadW < 0) {
      this.elements.oppCaptured.insertAdjacentHTML('beforeend', `<span class="captured-score">+${Math.abs(leadW)}</span>`);
    }
  }

  renderCapturedList(container, pieces) {
    container.innerHTML = '';
    
    // Sort pieces by value
    const order = { p:1, n:2, b:3, r:4, q:5 };
    pieces.sort((a,b) => order[a.type] - order[b.type]);
    
    pieces.forEach(p => {
      const wrapper = document.createElement('div');
      wrapper.className = 'captured-piece';
      wrapper.innerHTML = getPieceSVG(p.type, p.color);
      container.appendChild(wrapper);
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animations
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// Instantiate and boot
window.addEventListener('DOMContentLoaded', () => {
  const app = new ChessApp();
  app.boot();
});

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sélection des éléments clés
    const controlsCard = document.querySelector(".controls-card");
    const userBar = document.getElementById("user-bar");
    const btnNew = document.getElementById("btn-new");
    const btnResign = document.getElementById("btn-resign");

    // 2. Sauvegarde du conteneur d'origine (la console de droite)
    // On récupère le parent initial de la carte pour pouvoir la remettre à sa place plus tard
    const originalConsole = controlsCard ? controlsCard.parentElement : null;

    // 3. Action : Clic sur "New Game" -> Déplacement sous le joueur
    if (btnNew && controlsCard && userBar) {
        btnNew.addEventListener("click", () => {
            // Déplace proprement tout le bloc juste après le bandeau du joueur
            userBar.after(controlsCard);
            
            // Optionnel : Ajoute une classe pour styliser la carte différemment lorsqu'elle est à gauche
            controlsCard.classList.add("moved-under-player");
        });
    }

    // 4. Action : Clic sur "Resign" -> Retour à la console de droite
    if (btnResign && controlsCard && originalConsole) {
        btnResign.addEventListener("click", () => {
            // Remet le bloc à sa position initiale à droite
            originalConsole.appendChild(controlsCard);
            
            // Enlève la classe de transition si elle a été ajoutée
            controlsCard.classList.remove("moved-under-player");
        });
    }
});

