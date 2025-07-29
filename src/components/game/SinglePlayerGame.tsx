import type { GameMode, GamePhase, GameResult } from "@/hooks/useTypingGame";
import { generateRandomWords } from "@/utils/wordGenerator";
import { GlobeIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameSummary } from "./GameSummary";
import { SettingsDashboard } from "./SettingsDashboard";
import { TypingArea } from "./TypingArea";

type SinglePlayerGameProps = {
  myPlayerId: string;
};

export function SinglePlayerGame({ myPlayerId }: SinglePlayerGameProps) {
  const [textToType, setTextTypeToType] = useState<string>("");
  const [myTypedText, setMyTypedText] = useState<string>("");
  const myTypedTextRef = useRef(myTypedText);

  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting");
  const [gameMode, setGameMode] = useState<GameMode>("time");
  const [testDuration, setTestDuration] = useState<number>(30);
  // ? Can be removed
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [wordCount, setWordCount] = useState<number>(25);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const gameStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingAreaInputRef = useRef<HTMLInputElement | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    myTypedTextRef.current = myTypedText;
  }, [myTypedText]);

  const calculateResults = useCallback(() => {
    const typedText = myTypedTextRef.current;
    const fullText = textToType;

    let elapsedTimeInMinutes = 0;
    if (gameMode === "time") {
      elapsedTimeInMinutes = testDuration / 60;
    } else if (gameMode === "words" && gameStartTimeRef.current) {
      elapsedTimeInMinutes = (Date.now() - gameStartTimeRef.current) / 60000;
    }
    if (elapsedTimeInMinutes <= 0) elapsedTimeInMinutes = testDuration / 60;

    let correctChars = 0;
    let incorrectChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === fullText[i]) {
        correctChars++;
      } else {
        incorrectChars++;
      }
    }

    const totalChars = typedText.length;
    const wpm = Math.round(correctChars / 5 / elapsedTimeInMinutes);
    const rawWpm = Math.round(totalChars / 5 / elapsedTimeInMinutes);
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;

    return { wpm, rawWpm, accuracy, correctChars, incorrectChars, totalChars };
  }, [textToType, testDuration, gameMode]);

  const endGame = useCallback(() => {
    if (gamePhase === "finished") return;
    setGamePhase("finished");
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameResult(calculateResults());
  }, [calculateResults, gamePhase]);

  const restartGame = useCallback(() => {
    setGamePhase("waiting");
    setMyTypedText("");
    setGameResult(null);
    setTimeLeft(testDuration);
    gameStartTimeRef.current = null;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const newWordCount = gameMode === "words" ? wordCount : 200;
    setTextTypeToType(generateRandomWords(newWordCount));
    typingAreaInputRef.current?.focus();
  }, [gameMode, testDuration, wordCount]);

  //   Inital Setup
  useEffect(() => restartGame(), []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    restartGame();
  }, [testDuration, wordCount, gameMode]);

  useEffect(() => {
    if (myTypedText.length === 1 && gamePhase === "waiting") {
      setGamePhase("typing");
      gameStartTimeRef.current = Date.now();
    }
    if (
      gameMode === "words" &&
      myTypedText.length === textToType.length &&
      textToType.length > 0
    ) {
      endGame();
    }
  }, [endGame, gameMode, gamePhase, myTypedText.length, textToType.length]);

  useEffect(() => {
    if (gamePhase === "typing" && gameMode === "time") {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [endGame, gameMode, gamePhase]);

  const handleDurationChange = (duration: number) => {
    setGameMode("time");
    setTestDuration(duration);
    setTimeLeft(duration);
  };

  const handleWordCountChange = (count: number) => {
    setGameMode("words");
    setWordCount(count);
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center">
      {gamePhase === "finished" && gameResult ? (
        <GameSummary results={gameResult} onRestart={restartGame} />
      ) : (
        <>
          <SettingsDashboard
            gameMode={gameMode}
            setGameMode={setGameMode}
            testDuration={testDuration}
            onDurationChange={handleDurationChange}
            onWordCountChange={handleWordCountChange}
            wordCount={wordCount}
          />
          <div className="my-8 text-center h-12 flex items-center">
            {gameMode === "time" && (
              <div className="text-cyan-500 text-4xl font-bold">{timeLeft}</div>
            )}
          </div>
          <div className="w-full relative">
            <TypingArea
              text={textToType}
              typedText={myTypedText}
              onTextChange={setMyTypedText}
              isGameActive={gamePhase !== "finished"}
              playerCursors={[]}
              onMount={(ref) => (typingAreaInputRef.current = ref.current)}
            />
          </div>
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={restartGame}
              className="text-gray-400 hover:text-cyan-500 transition-colors p-2 rounded-full hover:bg-white"
            >
              <RefreshCwIcon />
            </button>
            <div className="p-2 rounded-full bg-white text-gray-400 flex items-center gap-2 text-sm">
              <GlobeIcon /> english
            </div>
          </div>
        </>
      )}
    </div>
  );
}
