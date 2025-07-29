import RoomInfoCard from "@/components/room/RoomInfoCard";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getRoomByCode } from "@/services/gameService";
import type { GameMessage } from "@/types/GameMessage";
import type { Player } from "@/types/Player";
import type { Room } from "@/types/Room";
import { Loader2, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RoomPage() {
  const navigate = useNavigate();
  const myPlayerId = localStorage.getItem("playerId");

  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback(
    (message: GameMessage) => {
      if (message.type === "ROOM_UPDATE") {
        setRoomData(message.payload as Room);
      } else if (message.type === "GAME_STARTED") {
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
      setError("No room found. Please create or join a new one.");
      setLoading(false);
      return;
    }

    setLoading(true);
    getRoomByCode(roomCode)
      .then((data: Room) => {
        setIsCreator(data.createdBy?.id === myPlayerId);
        setRoomData(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch room data:", err);
        setError("Failed to load room. It may have expired or never existed.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [myPlayerId]);

  const handleStartGame = () => {
    if (!isConnected || !roomData || !myPlayerId) return;
    sendMessage("/app/game/start", {
      roomId: roomData.id,
      playerId: myPlayerId,
    });
  };

  const waitingPlayer: Player = {
    id: "waiting",
    nickname: "Waiting for players to join...",
    roomId: "",
    currentPosition: 0,
    wpm: 0,
    accuracy: 0,
    isFinished: false,
    joinedAt: new Date().toISOString(),
  };

  const getButtonState = () => {
    if (!isConnected) {
      return { text: "Connecting...", disabled: true };
    }
    if (roomData && roomData.players.length < 2) {
      return { text: "Waiting for players...", disabled: true };
    }
    return { text: "Start Game", disabled: false };
  };

  const buttonState = getButtonState();

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin h-8 w-8 mb-4" />
        <p className="text-lg">Loading Room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center text-center p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Link to="/">
            <button className="mt-4 w-full px-4 py-3 font-semibold text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <RoomInfoCard
          code={roomData.code}
          players={
            roomData.players.length > 0 ? roomData.players : [waitingPlayer]
          }
        />
        {isCreator && (
          <button
            onClick={handleStartGame}
            disabled={buttonState.disabled}
            className="w-full px-4 py-3 text-lg font-semibold text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {buttonState.text}
          </button>
        )}
        {!isCreator && (
          <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-md">
            <p>Waiting for the host to start the game...</p>
          </div>
        )}
        {!isConnected && (
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
            <WifiOff size={16} />
            <span>Connection lost. Attempting to reconnect...</span>
          </div>
        )}
      </div>
    </div>
  );
}
