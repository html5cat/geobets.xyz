"use client";

import { create } from "zustand";

type GameState = {
  selectedImageId: string;
  setSelectedImageId: (id: string) => void;
  gameId: string;
  setGameId: (id: string) => void;
  commitDeadline?: number;
  revealDeadline?: number;
  setDeadlines: (c?: number, r?: number) => void;
};

export const useGameStore = create<GameState>((set) => ({
  selectedImageId: "",
  setSelectedImageId: (id) => set({ selectedImageId: id }),
  gameId: "",
  setGameId: (id) => set({ gameId: id }),
  commitDeadline: undefined,
  revealDeadline: undefined,
  setDeadlines: (c, r) => set({ commitDeadline: c, revealDeadline: r }),
}));


