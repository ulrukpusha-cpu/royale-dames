/**
 * Store Zustand pour l'état du jeu - Royale Dames
 * Types: red/white, Position {r,c}, Piece {color, isKing}
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialBoard, getAllLegalMoves } from '@/lib/draughtsLogic';
import type { Board, Piece, Position, Move } from '@/lib/draughtsLogic';

interface GameState {
  board: Board;
  currentTurn: 'red' | 'white';
  selectedSquare: Position | null;
  validMoves: Move[];
  moveHistory: Move[];
  capturedPieces: { red: NonNullable<Piece>[]; white: NonNullable<Piece>[] };
  gameId: string | null;
  gameMode: 'online' | 'ai' | null;
  aiDifficulty: 1 | 2 | 3 | 4 | 5 | null;

  initBoard: () => void;
  setBoard: (board: Board) => void;
  selectSquare: (position: Position) => void;
  clearSelection: () => void;
  makeMove: (move: Move) => void;
  undoMove: () => void;
  setCurrentTurn: (turn: 'red' | 'white') => void;
  resetGame: () => void;
  setGameMode: (mode: 'online' | 'ai' | null, difficulty?: 1 | 2 | 3 | 4 | 5) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      board: createInitialBoard(),
      currentTurn: 'red',
      selectedSquare: null,
      validMoves: [],
      moveHistory: [],
      capturedPieces: { red: [], white: [] },
      gameId: null,
      gameMode: null,
      aiDifficulty: null,

      initBoard: () =>
        set({
          board: createInitialBoard(),
          currentTurn: 'red',
          selectedSquare: null,
          validMoves: [],
          moveHistory: [],
          capturedPieces: { red: [], white: [] },
        }),

      setBoard: (board) => set({ board }),

      selectSquare: (position) => {
        const { board, currentTurn } = get();
        const piece = board[position.r]?.[position.c];
        if (!piece || piece.color !== currentTurn) {
          set({ selectedSquare: null, validMoves: [] });
          return;
        }
        const allMoves = getAllLegalMoves(board, currentTurn);
        const validMoves = allMoves.filter(
          m => m.from.r === position.r && m.from.c === position.c
        );
        set({ selectedSquare: position, validMoves });
      },

      clearSelection: () => set({ selectedSquare: null, validMoves: [] }),

      makeMove: (move) => {
        const { board, currentTurn, moveHistory, capturedPieces } = get();
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[move.from.r][move.from.c];
        if (!piece) return;

        newBoard[move.to.r][move.to.c] = piece;
        newBoard[move.from.r][move.from.c] = null;

        const newCaptured = { ...capturedPieces };
        if (move.captures?.length) {
          for (const cap of move.captures) {
            const captured = newBoard[cap.r][cap.c];
            if (captured) {
              newCaptured[captured.color].push(captured);
              newBoard[cap.r][cap.c] = null;
            }
          }
        }

        if (!piece.isKing) {
          if ((piece.color === 'red' && move.to.r === 0) || (piece.color === 'white' && move.to.r === 9)) {
            newBoard[move.to.r][move.to.c] = { ...piece, isKing: true };
          }
        }

        set({
          board: newBoard,
          currentTurn: currentTurn === 'red' ? 'white' : 'red',
          selectedSquare: null,
          validMoves: [],
          moveHistory: [...moveHistory, move],
          capturedPieces: newCaptured,
        });
      },

      undoMove: () => {
        const { moveHistory } = get();
        if (moveHistory.length === 0) return;
        set({ moveHistory: moveHistory.slice(0, -1) });
      },

      setCurrentTurn: (turn) => set({ currentTurn: turn }),

      resetGame: () =>
        set({
          board: createInitialBoard(),
          currentTurn: 'red',
          selectedSquare: null,
          validMoves: [],
          moveHistory: [],
          capturedPieces: { red: [], white: [] },
          gameId: null,
        }),

      setGameMode: (mode, difficulty) =>
        set({
          gameMode: mode,
          aiDifficulty: mode === 'ai' ? (difficulty ?? null) : null,
        }),
    }),
    { name: 'royale-dames-game', partialize: (s) => ({ moveHistory: s.moveHistory, gameMode: s.gameMode }) }
  )
);
