// LocalStorage manager for tracking user Elo, match history, and game settings.

const STORAGE_KEYS = {
  PLAYER_ELO: 'chess_player_elo',
  MATCH_HISTORY: 'chess_match_history',
  SETTINGS: 'chess_settings'
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  theme: 'neon-dark',
  showCoordinates: true,
  moveHints: true
};

export const StorageManager = {
  getPlayerElo() {
    const elo = localStorage.getItem(STORAGE_KEYS.PLAYER_ELO);
    return elo ? parseInt(elo, 10) : 1000;
  },

  setPlayerElo(elo) {
    localStorage.setItem(STORAGE_KEYS.PLAYER_ELO, elo.toString());
  },

  getMatchHistory() {
    const history = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
    return history ? JSON.parse(history) : [];
  },

  addMatchRecord(record) {
    // Record shape: { id, date, opponentName, opponentElo, playerColor, outcome, playerEloBefore, playerEloAfter }
    const history = this.getMatchHistory();
    history.unshift(record); // Add to the beginning
    // Limit history to 50 entries
    if (history.length > 50) {
      history.pop();
    }
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(history));
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.MATCH_HISTORY);
    localStorage.setItem(STORAGE_KEYS.PLAYER_ELO, '1000');
  },

  getSettings() {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(settings) } : { ...DEFAULT_SETTINGS };
  },

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  },

  // Calculates new Elo ratings based on FIDE standard Elo formula
  calculateEloChange(playerElo, opponentElo, score, kFactor = 32) {
    // Expected score
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    // New Elo
    const newElo = Math.round(playerElo + kFactor * (score - expectedScore));
    // Elo delta
    const delta = newElo - playerElo;
    
    return {
      newElo,
      delta: delta >= 0 ? `+${delta}` : `${delta}`
    };
  }
};
