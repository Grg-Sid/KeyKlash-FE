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

type GamePhase = "waiting" | "typing" | "finished";
type GameResult = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
};

const TIME_OPTIONS = [15, 30, 60, 120];

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
  const [testDuration, setTestDuration] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

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
    const elapsedTimeInMinutes = testDuration / 60;
    const typedText = myTypedTextRef.current;
    const fullText = roomData?.text || "";

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

  const restartGame = useCallback(() => {
    setGamePhase("waiting");
    setMyTypedText("");
    setGameResult(null);
    setTimeLeft(testDuration);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (!roomCode) {
      const newText = generateRandomWords(200);
      setRoomData((prev) => (prev ? { ...prev, text: newText } : null));
    }
    typingAreaInputRef.current?.focus();
  }, [testDuration, roomCode]);

  const handleDurationChange = (duration: number) => {
    setTestDuration(duration);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    restartGame();
  }, [testDuration, restartGame]);

  useEffect(() => {
    if (gamePhase === "typing") {
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
  }, [gamePhase, endGame]);

  const debouncedSendProgress = useDebouncedCallback(() => {
    if (!roomCode || !roomData || !myPlayerId) return;
    // TODO: Calculate real-time stats before sending
    const myPosition = myTypedText.length;

    sendMessage("/app/game/progress", {
      roomId: roomData.id,
      playerId: myPlayerId,
      currentPosition: myPosition,
      // wpm: myWpm,
      // accuracy: myAccuracy,
    });
  }, 200);

  const handleOnType = useCallback(
    (_newPosition: number, newTypedText: string) => {
      if (gamePhase === "finished") return;
      if (gamePhase === "waiting" && (countdown === 0 || countdown === null)) {
        setGamePhase("typing");
      }
      setMyTypedText(newTypedText);
      debouncedSendProgress();
    },
    [debouncedSendProgress, countdown, gamePhase]
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

  const { me, otherPlayers } = useMemo(() => {
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
  if (!roomData || !me)
    return <div className="p-4">Could not find game data for you.</div>;

  return (
    <div className="container mx-auto p-4 space-y-6 relative">
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 rounded-lg">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Game starts in...</p>
            <p className="text-9xl font-bold text-primary">{countdown}</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold">
        {roomCode ? `Room: ${roomData.code}` : "Timed Typing Test"}
      </h1>

      {gamePhase === "finished" && gameResult ? (
        <GameSummary results={gameResult} onRestart={restartGame} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-card rounded-lg shadow">
              <div className="text-sm text-muted-foreground">Time Left</div>
              <div className="text-3xl font-bold">{timeLeft}s</div>
            </div>
            {gamePhase === "waiting" && !roomCode && (
              <div className="p-4 bg-card rounded-lg shadow">
                <div className="text-sm text-muted-foreground mb-2">
                  Duration
                </div>
                <div className="flex gap-2 justify-center">
                  {TIME_OPTIONS.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleDurationChange(time)}
                      className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                        testDuration === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <TypingArea
            text={roomData.text}
            myTypedText={myTypedText}
            onType={handleOnType}
            isGameActive={
              gamePhase === "typing" ||
              (gamePhase === "waiting" &&
                (countdown === 0 || countdown === null))
            }
            playerCursors={playerCursors}
            onMount={(ref) => (typingAreaInputRef.current = ref.current)}
            myPosition={myTypedText.length}
          />
        </>
      )}

      {roomData.players.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Players</h2>
          <ul className="space-y-2">
            {roomData.players.map((player) => (
              <li key={player.id} className="p-3 bg-card rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <span
                    className="font-bold"
                    style={{ color: getPlayerColor(player.id) }}
                  >
                    {player.nickname} {player.id === myPlayerId && "(You)"}
                  </span>
                  <div className="text-sm space-x-4">
                    <span>WPM: {player.wpm}</span>
                    <span>Accuracy: {player.accuracy.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${
                        (player.currentPosition / roomData.text.length) * 100
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
  );
}
