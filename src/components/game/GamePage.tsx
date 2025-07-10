import { useDebounce } from "@/hooks/useDebounce";
import { useWebSocket } from "@/hooks/useWebSocket";
import { TypingArea, type PlayerCursor } from "./TypingArea";
import { getRoomByCode } from "@/services/gameService";
import type { GameMessage } from "@/types/GameMessage";
import type { Player } from "@/types/Player";
import type { Room } from "@/types/Room";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const myPlayerId = localStorage.getItem("playerId");

  const [roomData, setRoomData] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [myPosition, setMyPosition] = useState(0);

  const debouncedPoisiton = useDebounce(myPosition, 200);

  const handleMessage = useCallback(
    (message: GameMessage) => {
      if (message.type === "ROOM_UPDATE") {
        const updatedRoom = message.payload as Room;
        setRoomData(updatedRoom);

        const myData = updatedRoom.players.find(
          (p: Player) => p.id === myPlayerId
        );
        if (myData && myData.currentPosition !== myPosition) {
          setMyPosition(myData.currentPosition);
        }
      }
    },
    [myPlayerId, myPosition]
  );

  const { sendMessage, isConnected } = useWebSocket(
    roomData?.id || null,
    handleMessage
  );

  useEffect(() => {
    if (!roomCode) {
      setError("No room code provided in URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getRoomByCode(roomCode)
      .then(setRoomData)
      .catch((err) => {
        console.error("Error fetching initial room data:", err);
        setError("Could not load the game room");
      })
      .finally(() => setIsLoading(false));
  }, [roomCode]);

  useEffect(() => {
    if (isConnected && roomData && myPlayerId && debouncedPoisiton > 0) {
      sendMessage("/app/game/progress", {
        roomId: roomData.id,
        playerId: myPlayerId,
        currentPosition: debouncedPoisiton,
        typedText: roomData.text.substring(0, debouncedPoisiton),
      });
    }
  }, [debouncedPoisiton, isConnected, roomData, myPlayerId, sendMessage]);

  const onType = useCallback((newPosition: number) => {
    setMyPosition(newPosition);
  }, []);

  const playerCursors = useMemo<PlayerCursor[]>(() => {
    if (!roomData?.players) return [];

    return roomData.players
      .filter((player) => player.id !== myPlayerId)
      .map((player: Player) => ({
        playerId: player.id,
        position: player.currentPosition,
        color: "grey",
        nickname: player.nickname,
      }));
  }, [roomData?.players, myPlayerId]);

  if (isLoading) return <div>Loading Game...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!roomData) return <div>Game room not found.</div>;

  return (
    <div className="game-page p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-1">Race against your friends!</h1>
      <p className="mb-4 text-muted-foreground">Room Code: {roomData.code}</p>

      <TypingArea
        text={roomData.text}
        myPosition={myPosition}
        playerCursors={playerCursors}
        onType={onType}
        isGameActive={roomData.gameState === "IN_PROGRESS"}
      />

      <div className="player-progress mt-6">
        <h2 className="text-xl font-semibold">Live Progress</h2>
        <ul className="list-none space-y-2 mt-2">
          {roomData.players.map((player) => (
            <li key={player.id} className="p-2 border rounded-md bg-card">
              <div className="flex justify-between items-center">
                <span className="font-semibold" style={{ color: "black" }}>
                  {player.nickname} {player.id === myPlayerId && "(You)"}
                </span>
                <span className="text-sm font-mono">{player.wpm} WPM</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 5 mt-1">
                <div
                  className="bg-primary h-2 5 rounded-full"
                  style={{
                    width: `${
                      (player.currentPosition / roomData.text.length) * 100
                    }%`,
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
