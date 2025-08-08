"use client";

import { create } from "zustand";

type GameState = {
  selectedImageId: string;
  setSelectedImageId: (id: string) => void;
  gameId: string;
  setGameId: (id: string) => void;
};

export const useGameStore = create<GameState>((set) => ({
  selectedImageId: "",
  setSelectedImageId: (id) => set({ selectedImageId: id }),
  gameId: "",
  setGameId: (id) => set({ gameId: id }),
}));


