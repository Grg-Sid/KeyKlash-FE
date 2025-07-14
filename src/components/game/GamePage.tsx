import { useWebSocket } from "@/hooks/useWebSocket";
import type { GameMessage } from "@/types/GameMessage";
import type { Room } from "@/types/Room";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { getRoomByCode } from "@/services/gameService";
import { TypingArea, type PlayerCursor } from "./TypingArea";
import { useParams } from "react-router-dom";
import { getPlayerColor } from "@/utils";

type PlayerProgressPayload = {
  playerId: string;
  currentPosition: number;
  wpm: number;
  accuracy: number;
};

export default function GamePage() {
  const { roomCode: roomCode } = useParams<{ roomCode: string }>();
  const myPlayerId = localStorage.getItem("playerId");

  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);

  const [myTypedText, setMyTypedText] = useState<string>("");

  const gameStartTimeRef = useRef<number | null>(null);

  const handleMessage = useCallback(
    (message: GameMessage) => {
      if (message.type === "ROOM_UPDATE" || message.type === "GAME_STARTED") {
        const updatedRoom = message.payload as Room;
        setRoomData(updatedRoom);
      } else if (message.type === "PLAYER_PROGRESS") {
        const progress = message.payload as PlayerProgressPayload;

        // Ignore progress update myself
        if (progress.playerId === myPlayerId) return;

        setRoomData((currentRoomData) => {
          if (!currentRoomData) return null;

          const newPlayers = currentRoomData.players.map((player) => {
            if (player.id === progress.playerId) {
              return { ...player, ...progress };
            }
            return player;
          });

          return { ...currentRoomData, players: newPlayers };
        });
      } else if (message.type === "PLAYER_LEFT") {
        setRoomData(message.payload as Room);
      }
    },
    [myPlayerId]
  );

  const { sendMessage } = useWebSocket(roomData?.id || null, handleMessage);

  const { myWpm, myAccuracy, myPosition } = useMemo(() => {
    if (!gameStartTimeRef.current || !roomData?.text) {
      return { myWpm: 0, myAccuracy: 100, myPosition: 0 };
    }
    const fullText = roomData.text;

    let position = 0;
    for (let i = 0; i < myTypedText.length; i++) {
      if (myTypedText[i] != fullText[i]) {
        break;
      }
      position = i + 1;
    }

    const elapsedTimeInSeconds = (Date.now() - gameStartTimeRef.current) / 1000;
    const typedWords = myTypedText.length / 5;
    const wpm =
      elapsedTimeInSeconds > 0
        ? Math.round((typedWords / elapsedTimeInSeconds) * 60)
        : 0;

    let errors = 0;
    for (let i = 0; i < myTypedText.length; i++) {
      if (myTypedText[i] !== fullText[i]) {
        errors++;
      }
    }
    const accuracy =
      myTypedText.length > 0
        ? Math.max(
            0,
            ((myTypedText.length - errors) / myTypedText.length) * 100
          )
        : 100;

    return { myWpm: wpm, myAccuracy: accuracy, myPosition: position };
  }, [myTypedText, roomData?.text]);

  const debouncedSendProgress = useDebouncedCallback(() => {
    if (!roomData || !myPlayerId) return;
    sendMessage("/app/game/progress", {
      roomId: roomData.id,
      playerId: myPlayerId,
      currentPosition: myPosition,
      wpm: myWpm,
      accuracy: myAccuracy,
    });
  }, 200);

  const handleOnType = useCallback(
    (_newPosition: number, newTypedText: string) => {
      setMyTypedText(newTypedText);
      debouncedSendProgress();
    },
    [debouncedSendProgress]
  );

  useEffect(() => {
    if (!roomCode) {
      setError("Room code not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    getRoomByCode(roomCode)
      .then((data: Room) => {
        setRoomData(data);
        setError(null);
      })
      .catch(() => setError("Failed to load game room."))
      .finally(() => setLoading(false));
  }, [roomCode]);

  useEffect(() => {
    if (
      roomData?.gameState === "IN_PROGRESS" &&
      gameStartTimeRef.current === null
    ) {
      const serverStartTime = new Date(roomData.gameStartedAt!).getTime();
      const gameReadyTime = serverStartTime + 5000;

      setCountdown(5);

      const interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = gameReadyTime - now;

        if (timeLeft <= 0) {
          clearInterval(interval);
          setCountdown(0);
          gameStartTimeRef.current = gameReadyTime;
        } else {
          setCountdown(Math.ceil(timeLeft / 1000));
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [roomData?.gameState, roomData?.gameStartedAt]);

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

  const isGameActive = countdown === 0;

  if (loading) return <div className="p-4">Loading game...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!roomData || !me)
    return <div className="p-4">Could not find game data for you.</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 rounded-lg">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Game starts in...</p>
            <p className="text-9xl font-bold text-primary">{countdown}</p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Room: {roomData.code}</h1>
        <div className="text-lg font-semibold">{roomData.gameState}</div>
      </div>

      {/* Real-time stats display for the local player */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 bg-card rounded-lg shadow">
          <div className="text-sm text-muted-foreground">WPM</div>
          <div className="text-3xl font-bold">{myWpm}</div>
        </div>
        <div className="p-4 bg-card rounded-lg shadow">
          <div className="text-sm text-muted-foreground">Accuracy</div>
          <div className="text-3xl font-bold">{myAccuracy.toFixed(1)}%</div>
        </div>
      </div>

      <TypingArea
        text={roomData.text}
        myPosition={myPosition}
        myTypedText={myTypedText}
        onType={handleOnType}
        playerCursors={playerCursors}
        isGameActive={isGameActive}
      />

      {/* Player progress list */}
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
    </div>
  );
}
