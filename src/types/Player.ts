export interface Player {
  id: string;
  nickname: string;
  roomId: string;
  currentPosition: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  joinedAt: string;
  finishedAt?: string | null;
  sessionId?: string | null;
}
