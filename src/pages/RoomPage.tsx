import RoomInfoCard from "@/components/room/RoomInfoCard";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getRoomByCode } from "@/services/gameService";
import type { GameMessage } from "@/types/GameMessage";
import type { Player } from "@/types/Player";
import type { Room } from "@/types/Room";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoomPage() {
  const navigate = useNavigate();
  const myPlayerId = localStorage.getItem("playerId");

  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback(
    (message: GameMessage) => {
      console.log("Received Message:", message);
      if (message.type === "ROOM_UPDATE") {
        setRoomData(message.payload as Room);
      } else if (message.type == "GAME_STARTED") {
        setRoomData(message.payload as Room);
        navigate(`/room/${(message.payload as Room).code}/game`);
      }
    },
    [navigate]
  );

  const { sendMessage, isConnected } = useWebSocket(
    roomData?.id || null,
    handleMessage
  );

  useEffect(() => {
    const roomCode = localStorage.getItem("roomCode");
    if (!roomCode) {
      setError("Room code not found in local storage");
      setLoading(false);
      return;
    }

    setLoading(true);
    getRoomByCode(roomCode)
      .then((data: Room) => {
        setRoomData(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch room data:", err);
        setError(
          "Failed to load room. The room may not exist or the server is down."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleStartGame = () => {
    if (!isConnected) {
      alert("Not connected to the server yet. Please wait.");
      return;
    }

    if (!roomData || !myPlayerId) {
      console.error("Cannot start game: Missing room or player data.");
      return;
    }

    sendMessage("/app/game/start", {
      roomId: roomData.id,
      playerId: myPlayerId,
    });
  };

  if (loading) {
    return <div>Loading room...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!roomData) {
    return <div>Could not find room data.</div>;
  }

  const waitingPlayer: Player = {
    id: "waiting",
    nickname: "wating for players...",
    roomId: "",
    currentPosition: 0,
    wpm: 0,
    accuracy: 0,
    isFinished: false,
    joinedAt: new Date().toISOString(),
    finishedAt: null,
    sessionId: null,
  };

  return (
    <div className="space-y-4">
      <RoomInfoCard
        code={roomData.code}
        players={
          roomData.players.length > 0 ? roomData.players : [waitingPlayer]
        }
      />
      <Button
        onClick={handleStartGame}
        disabled={!isConnected || roomData.players.length < 2}
      >
        {isConnected ? "Start Game" : "Connecting..."}
      </Button>
      {!isConnected && (
        <p className="text-sm text-muted-foreground">
          Attempting to connect to the server...{" "}
        </p>
      )}
      {roomData.players.length < 2 && (
        <p className="text-sm text-muted-foreground">
          You need at least 2 players to start.
        </p>
      )}
    </div>
  );
}
