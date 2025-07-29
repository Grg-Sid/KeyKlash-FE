export type GamePhase = "waiting" | "typing" | "finished";
export type GameMode = "time" | "words";

export type GameResult = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
};
