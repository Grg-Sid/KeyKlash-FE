import type { Player } from "./Player";
import type { GameState } from "./GameState";

export interface Room {
  id: string;
  code: string;
  gameState: GameState;
  text: string;
  players: Player[];
  createdAt?: Date;
  gameStartedAt?: Date;
  gameEndedAt?: string;
  maxPlayers: number;
  createdBy?: Player;
}
