export interface Player {
  id: string;
  nickname: string;
  roomId: string;
  currentPosition: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  joinedAt: Date;
  finishedAt?: Date;
  sessionId: string;
}
