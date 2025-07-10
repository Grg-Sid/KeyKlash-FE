import type { MessageType } from "./MessageType";

export interface GameMessage<T = unknown> {
  type: MessageType;
  payload: T;
  roomId: string;
  playerId: string | null; // the player who initiated the action, if applicable
}
