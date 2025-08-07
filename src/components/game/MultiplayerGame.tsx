import type { GamePhase, GameResult } from "@/hooks/useTypingGame";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getRoomByCode } from "@/services/gameService";
import type { GameMessage } from "@/types/GameMessage";
import type { Room } from "@/types/Room";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TypingArea, type PlayerCursor } from "./TypingArea";
import { getPlayerColor } from "@/utils/getPlayerColor";
import { GameSummary } from "./GameSummary";
import { generateRandomWords } from "@/utils/wordGenerator";
import type { Player } from "@/types/Player";

type PlayerProgressPayload = {
  playerId: string;
  currentPosition: number;
  wpm: number;
  accuracy: number;
};

type MultiplayerGameProps = {
  roomCode: string;
  myPlayerId: string;
};

export function MultiplayerGame({
  roomCode,
  myPlayerId,
}: MultiplayerGameProps) {
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myTypedText, setMyTypedText] = useState<string>("");
  const myTypedTextRef = useRef(myTypedText);

  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting");
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const gameStartTimeRef = useRef<number | null>(null);
  const typingAreaInputRef = useRef<HTMLInputElement | null>(null);
  const endGameRef = useRef<() => void>(() => {});

  useEffect(() => {
    myTypedTextRef.current = myTypedText;
  }, [myTypedText]);

  const calculateResults = useCallback(() => {
    let gameDurationSeconds = 60;
    if (gameStartTimeRef.current) {
      gameDurationSeconds = (Date.now() - gameStartTimeRef.current) / 1000;
    }
    const elapsedTimeInMinutes = gameDurationSeconds / 60;
    const { correctChars, incorrectChars, totalChars } = (
      myTypedTextRef.current || ""
    )
      .split("")
      .reduce(
        (acc, char, i) => {
          if (char === roomData?.text[i]) acc.correctChars++;
          else acc.incorrectChars++;
          return acc;
        },
        {
          correctChars: 0,
          incorrectChars: 0,
          totalChars: myTypedTextRef.current.length,
        }
      );
    const wpm = Math.round(correctChars / 5 / elapsedTimeInMinutes);
    const rawWpm = Math.round(totalChars / 5 / elapsedTimeInMinutes);
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;

    return { wpm, rawWpm, accuracy, correctChars, incorrectChars, totalChars };
  }, [roomData?.text]);

  const handleMessage = useCallback(
    (message: GameMessage) => {
      const { type, payload } = message;
      if (
        type === "ROOM_UPDATE" ||
        type === "GAME_STARTED" ||
        type === "PLAYER_LEFT"
      ) {
        setCountdown(5);
        setRoomData(payload as Room);
      } else if (type === "PLAYER_PROGRESS") {
        const progress = payload as PlayerProgressPayload;
        if (progress.playerId === myPlayerId) return;
        setRoomData((current) =>
          !current
            ? null
            : {
                ...current,
                players: current.players.map((p) =>
                  p.id === progress.playerId ? { ...p, ...progress } : p
                ),
              }
        );
      } else if (type === "PLAYER_FINISHED") {
        const progress = payload as Player;
        if (progress.id === myPlayerId) {
          const result = calculateResults();
          console.log("Game finished with result:", result);
          setGameResult(result);
        }
      } else if (type === "GAME_RESTART") {
        const updatedRoomData = payload as Room;
        if (!updatedRoomData) return;

        setRoomData(updatedRoomData);
        setGamePhase("waiting");
        setCountdown(5);
        setGameResult(null);
        setMyTypedText("");
        gameStartTimeRef.current = null;
        typingAreaInputRef.current?.focus();
      } else if (type === "GAME_OVER") {
        console.log("Game over message received: ", payload);
        endGameRef?.current();
      }
    },
    [calculateResults, myPlayerId]
  );

  const { sendMessage } = useWebSocket(roomData?.id || null, handleMessage);

  const restartGame = useCallback(() => {
    if (!roomData || roomData.createdBy?.id !== myPlayerId) return;

    sendMessage("/app/game/restart", {
      roomId: roomData.id,
      newText: generateRandomWords(roomData.text.split(" ").length || 50),
    });
  }, [roomData, myPlayerId, sendMessage]);

  const endGame = useCallback(() => {
    if (gamePhase === "finished") return;
    setGamePhase("finished");
    sendMessage("/app/game/finish", {
      roomId: roomData?.id,
      playerId: myPlayerId,
      wpm: gameResult?.wpm,
      accuracy: gameResult?.accuracy,
    });
  }, [
    gamePhase,
    gameResult?.accuracy,
    gameResult?.wpm,
    myPlayerId,
    roomData?.id,
    sendMessage,
  ]);

  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);

  useEffect(() => {
    setLoading(true);
    getRoomByCode(roomCode)
      .then((data) => setRoomData(data))
      .catch(() => setError("Failed to load game  room"))
      .finally(() => setLoading(false));
  }, [roomCode]);

  useEffect(() => {
    if (roomData?.gameState === "IN_PROGRESS" && roomData.gameStartedAt) {
      const gameReadyTime = new Date(roomData.gameStartedAt).getTime() + 5000;
      const interval = setInterval(() => {
        const timeLeftToStart = gameReadyTime - Date.now();
        if (timeLeftToStart <= 0) {
          clearInterval(interval);
          setCountdown(0);
          setTimeout(() => {
            setCountdown(null);
            setGamePhase("typing");
            typingAreaInputRef.current?.focus();
          }, 500);
        } else {
          setCountdown(Math.ceil(timeLeftToStart / 1000));
        }
      }, 250);
      return () => clearInterval(interval);
    }
  }, [roomData?.gameStartedAt, roomData?.gameState]);

  const debouncedSendProgress = useDebouncedCallback(() => {
    if (!roomData || gamePhase !== "typing") return;
    sendMessage("/app/game/progress", {
      roomId: roomData.id,
      playerId: myPlayerId,
      currentPosition: myTypedTextRef.current.length,
    });
  }, 200);

  const handleOnType = useCallback(
    (newTypedText: string) => {
      if (gamePhase === "typing") {
        if (gameStartTimeRef.current === null) {
          gameStartTimeRef.current = Date.now();
        }
        setMyTypedText(newTypedText);
        debouncedSendProgress();
      }
    },
    [debouncedSendProgress, gamePhase]
  );

  const playerCursors: PlayerCursor[] = useMemo(
    () =>
      roomData?.players
        .filter((p) => p.id !== myPlayerId)
        .map((p) => ({
          playerId: p.id,
          position: p.currentPosition,
          color: getPlayerColor(p.id),
          nickname: p.nickname,
        })) || [],
    [myPlayerId, roomData?.players]
  );

  if (loading) return <div className="p-4">Loading game...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!roomData) return <div className="p-4">Could not find game data.</div>;

  return (
    <div className="w-full max-w-5xl flex flex-col items-center">
      {countdown !== null ? (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-50">
          <p className="text-9xl font-bold text-cyan-500 animate-pulse">
            {countdown}
          </p>
        </div>
      ) : gamePhase === "finished" && gameResult ? (
        <GameSummary
          results={gameResult}
          onRestart={
            roomData?.createdBy?.id === myPlayerId ? restartGame : undefined
          }
        />
      ) : (
        <>
          <div className="my-8 text-center h-12" />
          <div className="w-full relative">
            <TypingArea
              text={roomData.text}
              typedText={myTypedText}
              onTextChange={handleOnType}
              isGameActive={gamePhase === "typing"}
              playerCursors={playerCursors}
              onMount={(ref) => (typingAreaInputRef.current = ref.current)}
            />
          </div>

          {roomData.players.length > 1 && (
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
        </>
      )}
    </div>
  );
}
