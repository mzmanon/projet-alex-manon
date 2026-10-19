// Chess engine: piece definitions, move generation, game state

export type Color = 'white' | 'black';
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface GameState {
  board: Board;
  turn: Color;
  selected: [number, number] | null;
  legalMoves: [number, number][];
  inCheck: boolean;
  checkmate: boolean;
  stalemate: boolean;
  castlingRights: { white: { k: boolean; q: boolean }; black: { k: boolean; q: boolean } };
  enPassant: [number, number] | null;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  promotionPending: [number, number] | null;
}

// Unicode chess pieces
export const PIECE_UNICODE: Record<Color, Record<PieceType, string>> = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRank: PieceType[] = ['R','N','B','Q','K','B','N','R'];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: 'black' };
    board[1][col] = { type: 'P', color: 'black' };
    board[6][col] = { type: 'P', color: 'white' };
    board[7][col] = { type: backRank[col], color: 'white' };
  }
  return board;
}

export function initialState(): GameState {
  return {
    board: createInitialBoard(),
    turn: 'white',
    selected: null,
    legalMoves: [],
    inCheck: false,
    checkmate: false,
    stalemate: false,
    castlingRights: {
      white: { k: true, q: true },
      black: { k: true, q: true },
    },
    enPassant: null,
    capturedWhite: [],
    capturedBlack: [],
    promotionPending: null,
  };
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(sq => sq ? { ...sq } : null));
}

function findKing(board: Board, color: Color): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (sq && sq.type === 'K' && sq.color === color) return [r, c];
    }
  }
  return null;
}

function isSquareAttacked(board: Board, row: number, col: number, byColor: Color): boolean {
  const enemy = byColor;

  // Pawn attacks
  const pDir = enemy === 'white' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const pr = row + pDir, pc = col + dc;
    if (inBounds(pr, pc)) {
      const sq = board[pr][pc];
      if (sq && sq.type === 'P' && sq.color === enemy) return true;
    }
  }

  // Knight attacks
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nr = row + dr, nc = col + dc;
    if (inBounds(nr, nc)) {
      const sq = board[nr][nc];
      if (sq && sq.type === 'N' && sq.color === enemy) return true;
    }
  }

  // Rook/Queen (ranks and files)
  for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const sq = board[r][c];
      if (sq) {
        if (sq.color === enemy && (sq.type === 'R' || sq.type === 'Q')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // Bishop/Queen (diagonals)
  for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const sq = board[r][c];
      if (sq) {
        if (sq.color === enemy && (sq.type === 'B' || sq.type === 'Q')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // King attacks
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const nr = row + dr, nc = col + dc;
    if (inBounds(nr, nc)) {
      const sq = board[nr][nc];
      if (sq && sq.type === 'K' && sq.color === enemy) return true;
    }
  }

  return false;
}

function isInCheck(board: Board, color: Color): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king[0], king[1], color === 'white' ? 'black' : 'white');
}

function applyMove(
  board: Board,
  from: [number, number],
  to: [number, number],
  enPassant: [number, number] | null,
  promoteTo: PieceType = 'Q',
): Board {
  const newBoard = cloneBoard(board);
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = newBoard[fr][fc]!;

  // En passant capture
  if (piece.type === 'P' && enPassant && tr === enPassant[0] && tc === enPassant[1]) {
    const captureRow = piece.color === 'white' ? tr + 1 : tr - 1;
    newBoard[captureRow][tc] = null;
  }

  // Castling
  if (piece.type === 'K') {
    const dc = tc - fc;
    if (Math.abs(dc) === 2) {
      const rookFromCol = dc > 0 ? 7 : 0;
      const rookToCol = dc > 0 ? tc - 1 : tc + 1;
      newBoard[tr][rookToCol] = newBoard[tr][rookFromCol];
      newBoard[tr][rookFromCol] = null;
    }
  }

  // Move piece
  newBoard[tr][tc] = piece;
  newBoard[fr][fc] = null;

  // Promotion
  if (piece.type === 'P' && (tr === 0 || tr === 7)) {
    newBoard[tr][tc] = { type: promoteTo, color: piece.color };
  }

  return newBoard;
}

export function getRawMoves(
  board: Board,
  row: number,
  col: number,
  castlingRights: GameState['castlingRights'],
  enPassant: [number, number] | null,
): [number, number][] {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;
  const moves: [number, number][] = [];
  const opp = color === 'white' ? 'black' : 'white';

  const addIfValid = (r: number, c: number): boolean => {
    if (!inBounds(r, c)) return false;
    const sq = board[r][c];
    if (sq && sq.color === color) return false;
    moves.push([r, c]);
    return !sq; // returns true if square was empty (continue sliding)
  };

  switch (type) {
    case 'P': {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      // Forward
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        if (inBounds(nr, nc)) {
          const sq = board[nr][nc];
          if (sq && sq.color === opp) moves.push([nr, nc]);
          // En passant
          if (enPassant && nr === enPassant[0] && nc === enPassant[1]) {
            moves.push([nr, nc]);
          }
        }
      }
      break;
    }
    case 'N':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        addIfValid(row + dr, col + dc);
      }
      break;
    case 'B':
      for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let r = row + dr, c = col + dc;
        while (addIfValid(r, c)) { r += dr; c += dc; }
      }
      break;
    case 'R':
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        let r = row + dr, c = col + dc;
        while (addIfValid(r, c)) { r += dr; c += dc; }
      }
      break;
    case 'Q':
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let r = row + dr, c = col + dc;
        while (addIfValid(r, c)) { r += dr; c += dc; }
      }
      break;
    case 'K': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        addIfValid(row + dr, col + dc);
      }
      // Castling
      const rights = castlingRights[color];
      const backRow = color === 'white' ? 7 : 0;
      if (row === backRow && col === 4) {
        const notAttacked = (c: number) => !isSquareAttacked(board, backRow, c, opp);
        // Kingside
        if (rights.k && !board[backRow][5] && !board[backRow][6]
          && board[backRow][7]?.type === 'R'
          && notAttacked(4) && notAttacked(5) && notAttacked(6)) {
          moves.push([backRow, 6]);
        }
        // Queenside
        if (rights.q && !board[backRow][3] && !board[backRow][2] && !board[backRow][1]
          && board[backRow][0]?.type === 'R'
          && notAttacked(4) && notAttacked(3) && notAttacked(2)) {
          moves.push([backRow, 2]);
        }
      }
      break;
    }
  }
  return moves;
}

export function getLegalMoves(
  board: Board,
  row: number,
  col: number,
  castlingRights: GameState['castlingRights'],
  enPassant: [number, number] | null,
): [number, number][] {
  const piece = board[row][col];
  if (!piece) return [];
  const raw = getRawMoves(board, row, col, castlingRights, enPassant);
  return raw.filter(([tr, tc]) => {
    const nb = applyMove(board, [row, col], [tr, tc], enPassant);
    return !isInCheck(nb, piece.color);
  });
}

export function processMove(
  state: GameState,
  from: [number, number],
  to: [number, number],
  promoteTo: PieceType = 'Q',
): GameState {
  const { board, turn, castlingRights, enPassant, capturedWhite, capturedBlack } = state;
  const piece = board[from[0]][from[1]]!;
  const captured = board[to[0]][to[1]];
  const newBoard = applyMove(board, from, to, enPassant, promoteTo);

  // Update castling rights
  const newCastling = {
    white: { ...castlingRights.white },
    black: { ...castlingRights.black },
  };
  if (piece.type === 'K') {
    newCastling[turn] = { k: false, q: false };
  }
  if (piece.type === 'R') {
    if (from[1] === 7) newCastling[turn].k = false;
    if (from[1] === 0) newCastling[turn].q = false;
  }

  // En passant square
  let newEnPassant: [number, number] | null = null;
  if (piece.type === 'P' && Math.abs(to[0] - from[0]) === 2) {
    newEnPassant = [(from[0] + to[0]) / 2, from[1]];
  }

  // Captures tracking
  const newCapturedWhite = [...capturedWhite];
  const newCapturedBlack = [...capturedBlack];
  if (captured) {
    if (captured.color === 'white') newCapturedWhite.push(captured);
    else newCapturedBlack.push(captured);
  }
  // En passant capture tracking
  if (piece.type === 'P' && enPassant && to[0] === enPassant[0] && to[1] === enPassant[1]) {
    const capRow = turn === 'white' ? to[0] + 1 : to[0] - 1;
    const capPiece = board[capRow][to[1]];
    if (capPiece) {
      if (capPiece.color === 'white') newCapturedWhite.push(capPiece);
      else newCapturedBlack.push(capPiece);
    }
  }

  // Promotion pending?
  const promotionPending =
    piece.type === 'P' && (to[0] === 0 || to[0] === 7) ? to : null;

  const nextTurn: Color = turn === 'white' ? 'black' : 'white';
  const inCheck = isInCheck(newBoard, nextTurn);

  // Check if next player has legal moves
  let hasLegalMoves = false;
  outer: for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = newBoard[r][c];
      if (sq && sq.color === nextTurn) {
        const moves = getLegalMoves(newBoard, r, c, newCastling, newEnPassant);
        if (moves.length > 0) { hasLegalMoves = true; break outer; }
      }
    }
  }

  return {
    board: newBoard,
    turn: promotionPending ? turn : nextTurn,
    selected: null,
    legalMoves: [],
    inCheck,
    checkmate: !hasLegalMoves && inCheck,
    stalemate: !hasLegalMoves && !inCheck,
    castlingRights: newCastling,
    enPassant: newEnPassant,
    capturedWhite: newCapturedWhite,
    capturedBlack: newCapturedBlack,
    promotionPending: promotionPending ? (promoteTo ? null : promotionPending) : null,
  };
}
