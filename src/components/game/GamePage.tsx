import { useWebSocket } from "@/hooks/useWebSocket";
import type { GameMessage } from "@/types/GameMessage";
import type { Room } from "@/types/Room";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { getRoomByCode } from "@/services/gameService";
import { TypingArea, type PlayerCursor } from "./TypingArea";
import { useParams } from "react-router-dom";
import { getPlayerColor } from "@/utils/getPlayerColor";
import { generateRandomWords } from "@/utils/wordGenerator";
import { GameSummary } from "./GameSummary";
import type { GameMode } from "@/hooks/useTypingGame";
import { GlobeIcon, RefreshCwIcon } from "@/assets/icons";
import { SettingsDashboard } from "./SettingsDashboard";

type GamePhase = "waiting" | "typing" | "finished";
type GameResult = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
};

type PlayerProgressPayload = {
  playerId: string;
  currentPosition: number;
  wpm: number;
  accuracy: number;
};

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();

  const myPlayerId = useMemo(() => {
    let pid = localStorage.getItem("playerId");
    if (!pid) {
      pid = `local-player-${Date.now()}`;
      localStorage.setItem("playerId", pid);
    }
    return pid;
  }, []);

  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myTypedText, setMyTypedText] = useState<string>("");

  const myTypedTextRef = useRef(myTypedText);
  useEffect(() => {
    myTypedTextRef.current = myTypedText;
  }, [myTypedText]);

  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting");
  const [gameMode, setGameMode] = useState<GameMode>("time");
  const [testDuration, setTestDuration] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [wordCount, setWordCount] = useState<number>(25);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const gameStartTimeRef = useRef<number | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingAreaInputRef = useRef<HTMLInputElement | null>(null);
  const isInitialMount = useRef(true);

  const [countdown, setCountdown] = useState<number | null>(null);

  const handleMessage = useCallback(
    (message: GameMessage) => {
      if (message.type === "ROOM_UPDATE" || message.type === "GAME_STARTED") {
        setRoomData(message.payload as Room);
      } else if (message.type === "PLAYER_PROGRESS") {
        const progress = message.payload as PlayerProgressPayload;
        if (progress.playerId === myPlayerId) return;
        setRoomData((currentRoomData) => {
          if (!currentRoomData) return null;
          const newPlayers = currentRoomData.players.map((player) =>
            player.id === progress.playerId
              ? { ...player, ...progress }
              : player
          );
          return { ...currentRoomData, players: newPlayers };
        });
      } else if (message.type === "PLAYER_LEFT") {
        setRoomData(message.payload as Room);
      }
    },
    [myPlayerId]
  );

  const { sendMessage } = useWebSocket(
    roomCode ? roomData?.id || null : null,
    handleMessage
  );

  const calculateResults = useCallback(() => {
    const typedText = myTypedTextRef.current;
    const fullText = roomData?.text || "";

    let elapsedTimeInMinutes: number = 0;
    if (gameMode === "time") {
      elapsedTimeInMinutes = testDuration / 60;
    } else if (gameMode === "words") {
      const endTime = Date.now();
      const startTime = gameStartTimeRef.current ?? endTime - 1000;
      elapsedTimeInMinutes = (endTime - startTime) / 60000;
    }

    let correctChars = 0;
    let incorrectChars = 0;

    for (let i = 0; i < typedText.length; i++) {
      if (i < fullText.length) {
        if (typedText[i] === fullText[i]) {
          correctChars++;
        } else {
          incorrectChars++;
        }
      } else {
        incorrectChars++;
      }
    }

    const totalChars = typedText.length;
    const wpm = Math.round(correctChars / 5 / elapsedTimeInMinutes);
    const rawWpm = Math.round(totalChars / 5 / elapsedTimeInMinutes);
    const accuracy =
      totalChars > 0
        ? Math.max(0, ((totalChars - incorrectChars) / totalChars) * 100)
        : 100;

    return { wpm, rawWpm, accuracy, correctChars, incorrectChars, totalChars };
  }, [roomData?.text, testDuration]);

  const endGame = useCallback(() => {
    if (gamePhase === "finished") return;
    setGamePhase("finished");
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const results = calculateResults();
    setGameResult(results);
  }, [gamePhase, calculateResults]);

  useEffect(() => {
    if (
      myTypedText.length === 1 &&
      gamePhase === "waiting" &&
      (countdown === 0 || countdown === null)
    ) {
      setGamePhase("typing");
      if (gameMode === "words") {
        gameStartTimeRef.current = Date.now();
      }
    }
    if (
      gameMode === "words" &&
      myTypedText.length > 0 &&
      myTypedText.length === roomData?.text.length
    ) {
      endGame();
    }
  }, [myTypedText, gamePhase, countdown, gameMode, roomData?.text, endGame]);

  const restartGame = useCallback(() => {
    setGamePhase("waiting");
    setMyTypedText("");
    myTypedTextRef.current = "";
    setGameResult(null);
    setTimeLeft(testDuration);
    gameStartTimeRef.current = null;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (!roomCode) {
      const newWordCount = gameMode === "words" ? wordCount : 200;
      const newText = generateRandomWords(newWordCount);
      setRoomData((prev) => (prev ? { ...prev, text: newText } : null));
    }
    typingAreaInputRef.current?.focus();
  }, [testDuration, roomCode, gameMode, wordCount]);

  const handleDurationChange = (duration: number) => {
    setGameMode("time");
    setTestDuration(duration);
    setTimeLeft(duration);
  };

  const handleWordCountChange = (count: number) => {
    setGameMode("words");
    setWordCount(count);
    // setTestDuration(999);
    // setTimeLeft(999);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!roomCode) {
      if (gameMode === "time") {
        restartGame();
      } else if (gameMode === "words") {
        restartGame();
      }
    }
  }, [testDuration, gameMode, roomCode, wordCount]);

  useEffect(() => {
    if (gamePhase === "typing" && gameMode === "time") {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current!);
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gamePhase, endGame, gameMode]);

  const debouncedSendProgress = useDebouncedCallback(() => {
    if (!roomCode || !roomData || !myPlayerId) return;

    sendMessage("/app/game/progress", {
      roomId: roomData.id,
      playerId: myPlayerId,
      currentPosition: myTypedTextRef.current.length,
    });
  }, 200);

  const handleOnType = useCallback(
    (newTypedText: string) => {
      setMyTypedText(newTypedText);
      debouncedSendProgress();
    },
    [debouncedSendProgress]
  );

  useEffect(() => {
    setLoading(true);
    if (roomCode) {
      getRoomByCode(roomCode)
        .then((data) => setRoomData(data))
        .catch(() => setError("Failed to load game room."))
        .finally(() => setLoading(false));
    } else {
      const text = generateRandomWords(200);
      const singlePlayerRoom: Room = {
        id: "single-player",
        code: "Single Player",
        gameState: "IN_PROGRESS",
        text,
        gameStartedAt: new Date(),
        players: [
          {
            id: myPlayerId,
            nickname: "You",
            wpm: 0,
            accuracy: 100,
            currentPosition: 0,
            roomId: "",
            isFinished: false,
            joinedAt: "",
          },
        ],
        createdAt: undefined,
        maxPlayers: 0,
        createdBy: undefined,
      };
      setRoomData(singlePlayerRoom);
      setLoading(false);
    }
  }, [roomCode, myPlayerId]);

  useEffect(() => {
    if (roomData?.gameState === "IN_PROGRESS") {
      const serverStartTime = new Date(roomData.gameStartedAt!).getTime();
      let gameReadyTime = serverStartTime;

      if (roomCode) {
        gameReadyTime = gameReadyTime + 5000;
        setCountdown(5);
      } else {
        setCountdown(0);
      }

      const interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = gameReadyTime - now;

        if (timeLeft <= 0) {
          clearInterval(interval);
          setCountdown(0);
        } else {
          setCountdown(Math.ceil(timeLeft / 1000));
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [roomData?.gameState, roomData?.gameStartedAt, roomCode]);

  const { otherPlayers } = useMemo(() => {
    const me = roomData?.players.find((p) => p.id === myPlayerId) || null;
    const otherPlayers =
      roomData?.players.filter((p) => p.id !== myPlayerId) || [];
    return { me, otherPlayers };
  }, [roomData?.players, myPlayerId]);

  const playerCursors: PlayerCursor[] = useMemo(
    () =>
      otherPlayers.map((p) => ({
        playerId: p.id,
        position: p.currentPosition,
        color: getPlayerColor(p.id),
        nickname: p.nickname,
      })),
    [otherPlayers]
  );

  if (loading) return <div className="p-4">Loading game...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!roomData)
    return <div className="p-4">Could not find game data for you.</div>;

  return (
    <div className="bg-[#f0f0f0] min-h-screen text-[#333] flex flex-col font-sans">
      {/* TODO */}
      <header className="px-12 py-3">{/* Header Content */}</header>

      <main className="flex-grow flex flex-col items-center justify-center -mt-16 px-4">
        <div className="w-full max-w-5xl flex flex-col items-center">
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-50">
              <p className="text-9xl font-bold text-cyan-500 animate-pulse">
                {countdown}
              </p>
            </div>
          )}

          {gamePhase === "finished" && gameResult ? (
            <GameSummary
              results={gameResult}
              onRestart={() => {
                if (gameMode === "time") {
                  restartGame();
                } else if (gameMode === "words") {
                  restartGame();
                }
              }}
            />
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
                  <div className="text-cyan-500 text-4xl font-bold">
                    {timeLeft}
                  </div>
                )}
              </div>
              <div className="w-full relative">
                <TypingArea
                  text={roomData.text}
                  typedText={myTypedText}
                  onTextChange={handleOnType}
                  isGameActive={
                    gamePhase !== "finished" &&
                    (countdown === 0 || countdown === null)
                  }
                  playerCursors={playerCursors}
                  onMount={(ref) => (typingAreaInputRef.current = ref.current)}
                />
              </div>
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => {
                    if (gameMode === "time") {
                      restartGame();
                    } else if (gameMode === "words") {
                      restartGame();
                    }
                  }}
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

          {roomData.players.length > 1 && gamePhase !== "finished" && (
            <div className="w-full mt-12">
              <h2 className="text-xl font-semibold mb-2 text-gray-500">
                Players
              </h2>
              <ul className="space-y-2">
                {roomData.players.map((player) => (
                  <li
                    key={player.id}
                    className="p-3 bg-white rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className="font-bold"
                        style={{ color: getPlayerColor(player.id) }}
                      >
                        {player.nickname} {player.id === myPlayerId && "(You)"}
                      </span>
                      <div className="text-sm space-x-4 text-gray-500">
                        <span>
                          WPM:{" "}
                          <span className="font-semibold text-gray-700">
                            {player.wpm}
                          </span>
                        </span>
                        <span>
                          Acc:{" "}
                          <span className="font-semibold text-gray-700">
                            {player.accuracy.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${
                            (player.currentPosition /
                              (roomData.text.length || 1)) *
                            100
                          }%`,
                          backgroundColor: getPlayerColor(player.id),
                          transition: "width 0.2s ease-in-out",
                        }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
