/**
 * Logique partagée du jeu de dames 10x10 international - Royale Dames
 */
export const BOARD_SIZE = 10;

export type Piece = { color: 'red' | 'white'; isKing: boolean } | null;
export type Board = Piece[][];
export type Position = { r: number; c: number };
export type Move = { from: Position; to: Position; captures: Position[] };

const isValidPos = (r: number, c: number) => r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;

function getCapturesForPiece(b: Board, piece: Piece, r: number, c: number): Move[] {
  if (!piece) return [];
  const moves: Move[] = [];
  const dirs: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  const search = (cr: number, cc: number, currentBoard: Board, currentPath: Position[], captured: Position[]) => {
    let foundContinuation = false;
    dirs.forEach(([dr, dc]) => {
      if (piece!.isKing) {
        for (let dist = 1; dist < BOARD_SIZE; dist++) {
          const tr = cr + dr * dist;
          const tc = cc + dc * dist;
          if (!isValidPos(tr, tc)) break;
          const target = currentBoard[tr][tc];
          if (target) {
            if (target.color === piece!.color) break;
            for (let landDist = dist + 1; landDist < BOARD_SIZE; landDist++) {
              const lr = cr + dr * landDist;
              const lc = cc + dc * landDist;
              if (!isValidPos(lr, lc) || currentBoard[lr][lc]) break;
              foundContinuation = true;
              const nextBoard = currentBoard.map(row => [...row]);
              nextBoard[tr][tc] = null;
              nextBoard[lr][lc] = piece!;
              nextBoard[cr][cc] = null;
              search(lr, lc, nextBoard, [...currentPath, { r: lr, c: lc }], [...captured, { r: tr, c: tc }]);
            }
            break;
          }
        }
      } else {
        const tr = cr + dr * 2;
        const tc = cc + dc * 2;
        const mr = cr + dr;
        const mc = cc + dc;
        if (isValidPos(tr, tc)) {
          const mid = currentBoard[mr]?.[mc];
          if (mid && mid.color !== piece!.color && !currentBoard[tr][tc]) {
            foundContinuation = true;
            const nextBoard = currentBoard.map(row => [...row]);
            nextBoard[mr][mc] = null;
            nextBoard[tr][tc] = piece!;
            nextBoard[cr][cc] = null;
            search(tr, tc, nextBoard, [...currentPath, { r: tr, c: tc }], [...captured, { r: mr, c: mc }]);
          }
        }
      }
    });
    if (!foundContinuation && currentPath.length > 0) {
      moves.push({ from: { r, c }, to: currentPath[currentPath.length - 1], captures });
    }
  };
  search(r, c, b.map(row => [...row]), [], []);
  return moves;
}

function getSimpleMovesForPiece(b: Board, piece: Piece, r: number, c: number): Move[] {
  if (!piece) return [];
  const moves: Move[] = [];
  const dirs: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  dirs.forEach(([dr, dc]) => {
    if (!piece!.isKing) {
      if (piece!.color === 'red' && dr !== -1) return;
      if (piece!.color === 'white' && dr !== 1) return;
    }
    if (piece!.isKing) {
      for (let i = 1; i < BOARD_SIZE; i++) {
        const tr = r + dr * i;
        const tc = c + dc * i;
        if (!isValidPos(tr, tc) || b[tr][tc]) break;
        moves.push({ from: { r, c }, to: { r: tr, c: tc }, captures: [] });
      }
    } else {
      const tr = r + dr;
      const tc = c + dc;
      if (isValidPos(tr, tc) && !b[tr][tc]) {
        moves.push({ from: { r, c }, to: { r: tr, c: tc }, captures: [] });
      }
    }
  });
  return moves;
}

export function getAllLegalMoves(board: Board, player: 'red' | 'white'): Move[] {
  let captureMoves: Move[] = [];
  let simpleMoves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p && p.color === player) {
        captureMoves = [...captureMoves, ...getCapturesForPiece(board, p, r, c)];
        simpleMoves = [...simpleMoves, ...getSimpleMovesForPiece(board, p, r, c)];
      }
    }
  }
  if (captureMoves.length > 0) {
    const maxCaptures = Math.max(...captureMoves.map(m => m.captures.length));
    return captureMoves.filter(m => m.captures.length === maxCaptures);
  }
  return simpleMoves;
}

export function createInitialBoard(): Board {
  return Array(BOARD_SIZE).fill(null).map((_, r) =>
    Array(BOARD_SIZE).fill(null).map((_, c) => {
      if ((r + c) % 2 === 1) {
        if (r < 4) return { color: 'white', isKing: false };
        if (r > 5) return { color: 'red', isKing: false };
      }
      return null;
    })
  );
}
