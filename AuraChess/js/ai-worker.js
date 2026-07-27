// AI Web Worker running the minimax chess engine with alpha-beta search.
// Uses a local chess.js build for state validation.

importScripts('./chess.min.js');

// Piece-Square Tables (PST) for positional evaluation.
// Values from White's perspective. For Black, we mirror the table vertically.
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  5,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

// King Middle Game table (encourages castling)
const KING_MID_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// King End Game table (encourages active King in center)
const KING_END_PST = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Map piece square index to row and column
function getPSTValue(pieceType, color, squareName, isEndgame) {
  // Translate chess square (e.g. 'e4') to 0-7, 0-7 indices
  const files = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
  const col = files[squareName[0]];
  const row = 8 - parseInt(squareName[1], 10);
  
  let table;
  switch (pieceType) {
    case 'p': table = PAWN_PST; break;
    case 'n': table = KNIGHT_PST; break;
    case 'b': table = BISHOP_PST; break;
    case 'r': table = ROOK_PST; break;
    case 'q': table = QUEEN_PST; break;
    case 'k': table = isEndgame ? KING_END_PST : KING_MID_PST; break;
    default: return 0;
  }
  
  // If Black, vertical mirroring
  if (color === 'b') {
    return table[7 - row][col];
  }
  return table[row][col];
}

// Evaluate the board statically from the perspective of white
function evaluateBoard(game) {
  let score = 0;
  const board = game.board();
  
  // Detect endgame phase by counting major pieces (Queens, Rooks, Bishops, Knights)
  let majorPieceCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'p' && piece.type !== 'k') {
        majorPieceCount++;
      }
    }
  }
  const isEndgame = majorPieceCount <= 4;
  
  // Columns/files map
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const squareName = files[c] + (8 - r);
        const value = PIECE_VALUES[piece.type] + getPSTValue(piece.type, piece.color, squareName, isEndgame);
        
        if (piece.color === 'w') {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  
  return score;
}

// Order moves for better alpha-beta pruning (checks & captures first)
function orderMoves(game, moves) {
  return moves.map(move => {
    let score = 0;
    
    // Captures get positive priority based on relative material
    if (move.captured) {
      score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
    }
    // Promotions are excellent
    if (move.promotion) {
      score += PIECE_VALUES[move.promotion];
    }
    // Check is high priority
    game.move(move);
    if (game.in_check()) {
      score += 50;
    }
    game.undo();
    
    return { move, score };
  }).sort((a, b) => b.score - a.score).map(item => item.move);
}

// Minimax with Alpha-Beta Pruning
function minimax(game, depth, alpha, beta, isMaximizing, stats) {
  stats.nodes++;
  
  if (depth === 0) {
    return quiescenceSearch(game, alpha, beta, isMaximizing, stats);
  }
  
  if (game.game_over()) {
    if (game.in_checkmate()) {
      return isMaximizing ? -25000 + (4 - depth) : 25000 - (4 - depth); // Prefer quicker mate
    }
    return 0; // Draw, stalemate, repetition
  }
  
  const moves = orderMoves(game, game.moves({ verbose: true }));
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false, stats);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Beta cut-off
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true, stats);
      game.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha cut-off
      }
    }
    return minEval;
  }
}

// Quiescence Search - explores capture sequences to avoid the horizon effect
function quiescenceSearch(game, alpha, beta, isMaximizing, stats) {
  stats.nodes++;
  const standPat = evaluateBoard(game);
  
  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    
    const moves = game.moves({ verbose: true }).filter(m => m.captured);
    const orderedMovesList = orderMoves(game, moves);
    
    for (const move of orderedMovesList) {
      game.move(move);
      const score = quiescenceSearch(game, alpha, beta, false, stats);
      game.undo();
      
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
    
    const moves = game.moves({ verbose: true }).filter(m => m.captured);
    const orderedMovesList = orderMoves(game, moves);
    
    for (const move of orderedMovesList) {
      game.move(move);
      const score = quiescenceSearch(game, alpha, beta, true, stats);
      game.undo();
      
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

// AI Listener
self.onmessage = function(e) {
  const { fen, playerElo, aiColor } = e.data;
  
  // Create a game state instance
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  
  if (moves.length === 0) {
    self.postMessage({ bestMove: null });
    return;
  }
  
  // Configure Engine Settings based on Player's current Elo
  let depth = 3;
  let blunderChance = 0; // Probability [0, 1] of injecting a blunder / suboptimal move
  
  if (playerElo < 600) {
    // Beginner 1: Super easy
    depth = 1;
    blunderChance = 0.40;
  } else if (playerElo < 1000) {
    // Beginner 2: Easy
    depth = 1;
    blunderChance = 0.25;
  } else if (playerElo < 1300) {
    // Casual/Intermediate 1
    depth = 2;
    blunderChance = 0.15;
  } else if (playerElo < 1600) {
    // Casual/Intermediate 2
    depth = 3;
    blunderChance = 0.05;
  } else if (playerElo < 1900) {
    // Advanced
    depth = 3;
    blunderChance = 0;
  } else if (playerElo < 2200) {
    // Pro
    depth = 4;
    blunderChance = 0;
  } else {
    // Grandmaster / Ultra-Pro
    depth = 5;
    blunderChance = 0;
  }
  
  // Apply blunder chance: Pick a random move or sub-optimal move
  if (Math.random() < blunderChance && moves.length > 0) {
    // We make a random move to represent a human mistake at lower ratings
    const randomIndex = Math.floor(Math.random() * moves.length);
    const chosenMove = moves[randomIndex];
    
    // Simulate thinking delay
    setTimeout(() => {
      self.postMessage({ 
        bestMove: chosenMove.san,
        from: chosenMove.from,
        to: chosenMove.to,
        promotion: chosenMove.promotion,
        nodesCalculated: 1,
        mode: 'blunder' 
      });
    }, 500 + Math.random() * 500); // 500ms - 1000ms human delay
    return;
  }
  
  // Otherwise, run alpha-beta search
  const stats = { nodes: 0 };
  const isMaximizing = aiColor === 'w'; // White maximizes, Black minimizes
  
  let bestEval = isMaximizing ? -Infinity : Infinity;
  let bestMoves = [];
  
  const startTime = Date.now();
  
  // Main search loop
  const orderedMovesList = orderMoves(game, moves);
  for (const move of orderedMovesList) {
    game.move(move);
    const evaluation = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing, stats);
    game.undo();
    
    if (isMaximizing) {
      if (evaluation > bestEval) {
        bestEval = evaluation;
        bestMoves = [move];
      } else if (evaluation === bestEval) {
        bestMoves.push(move);
      }
    } else {
      if (evaluation < bestEval) {
        bestEval = evaluation;
        bestMoves = [move];
      } else if (evaluation === bestEval) {
        bestMoves.push(move);
      }
    }
  }
  
  // Select one of the equally good moves
  const finalMove = bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
  const timeTaken = Date.now() - startTime;
  
  // Add a minimum delay of 400ms to avoid instant movements (better UX)
  const remainingDelay = Math.max(0, 450 - timeTaken);
  
  setTimeout(() => {
    self.postMessage({
      bestMove: finalMove.san,
      from: finalMove.from,
      to: finalMove.to,
      promotion: finalMove.promotion,
      nodesCalculated: stats.nodes,
      evalScore: bestEval,
      timeTaken: timeTaken + remainingDelay
    });
  }, remainingDelay);
};
