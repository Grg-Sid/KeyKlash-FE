import { generateRandomWords } from "@/utils/wordGenerator";
import { useCallback, useEffect, useRef, useState } from "react";

export type GamePhase = "waiting" | "typing" | "finished";
export type GameMode = "time" | "words";
export interface GameSettings {
  mode: GameMode;
  time: number;
  words: number;
  raceWPM: number;
}
export type GameResult = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
};

export const useTypingGame = (p0: {
  textToType: string;
  settings: GameSettings;
}) => {
  const [settings, setSettings] = useState<GameSettings>({
    mode: "time",
    time: 30,
    words: 25,
    raceWPM: 60,
  });
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [textToType, setTextToType] = useState<string>("");
  const [typedText, setTypedText] = useState<string>("");
  const [result, setResult] = useState<GameResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(settings.time);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typedTextRef = useRef(typedText);
  useEffect(() => {
    typedTextRef.current = typedText;
  }, [typedText]);

  const endGame = useCallback(() => {
    setPhase((prevPhase) => {
      if (prevPhase === "finished") return prevPhase;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const typed = typedTextRef.current;
      //   TODO
      const correctChars = typed.split("").reduce((acc, char, i) => {
        return textToType[i] === char ? acc + 1 : acc;
      }, 0);
      const incorrectChars = typed.length - correctChars;
      const accuracy =
        typed.length > 0 ? (correctChars / typed.length) * 100 : 100;
      const elapsedTimeInMinutes =
        (settings.mode === "time" ? settings.time - timeLeft : timeElapsed) /
        60;
      const wpm =
        elapsedTimeInMinutes > 0
          ? Math.round(correctChars / 5 / elapsedTimeInMinutes)
          : 0;
      const rawWpm =
        elapsedTimeInMinutes > 0
          ? Math.round(typed.length / 5 / elapsedTimeInMinutes)
          : 0;

      setResult({
        wpm,
        rawWpm,
        accuracy,
        correctChars,
        incorrectChars,
        totalChars: typed.length,
      });

      return "finished";
    });
  }, [settings.mode, settings.time, textToType, timeElapsed, timeLeft]);

  const restartGame = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const wordCount = settings.mode === "words" ? settings.words : 100;
    setTextToType(generateRandomWords(wordCount));
    setPhase("waiting");
    setTypedText("");
    setResult(null);
    setTimeLeft(settings.time);
    setTimeElapsed(0);
  }, [settings]);

  useEffect(() => {
    restartGame();
  }, [settings, restartGame]);

  useEffect(() => {
    if (phase !== "typing") return;

    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
      if (settings.mode === "time") {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [endGame, phase, settings.mode]);

  const handleType = useCallback(
    (newTypedText: string) => {
      if (phase === "finished") return;
      if (phase === "waiting") {
        setPhase("typing");
      }

      if (newTypedText.length > textToType.length) return;

      setTypedText(newTypedText);

      if (
        settings.mode === "words" &&
        newTypedText.length === textToType.length
      ) {
        // TODO
        endGame();
      }
    },
    [endGame, phase, settings.mode, textToType.length]
  );

  return {
    phase,
    settings,
    setSettings,
    textToType,
    typedText,
    handleType,
    timeLeft,
    timeElapsed,
    result,
    restartGame,
    setPhase,
  };
};
