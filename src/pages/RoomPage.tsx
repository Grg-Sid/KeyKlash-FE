import RoomInfoCard from "@/components/room/RoomInfoCard";
import { Button } from "@/components/ui/button";
import { getRoomByCode } from "@/services/gameService";
import type { Room } from "@/types/Room";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function RoomPage() {
  const roomCode = localStorage.getItem("roomCode");
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomData) {
      console.error("Room data not available");
      return;
    }

    navigate(`/room/${roomData.code}/game`);
    console.log("Starting game for room:", roomData.id);
  };

  useEffect(() => {
    if (!roomCode) {
      setError("Room code not found. Please join a room again.");
      setLoading(false);
      return;
    }

    const fetchAndSubscribe = async () => {
      // 1. Initial data fetch
      try {
        setLoading(true);
        const room = await getRoomByCode(roomCode);
        setRoomData(room);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error fetching initial room data:", err);
          setError("Failed to load room data. The room may not exist.");
        }
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }

      const eventSource = new EventSource(
        `${API_URL}/api/room/${roomCode}/stream`
      );
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection opened successfully.");
        setError(null);
      };

      eventSource.addEventListener("playerUpdate", (event) => {
        console.log("Received playerUpdate event:", event.data);
        try {
          const updatedRoom: Room = JSON.parse(event.data);
          setRoomData(updatedRoom);
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      });

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setError("Connection to the server was lost. Please refresh.");
        eventSource.close(); // Close the connection on error
      };
    };

    fetchAndSubscribe();

    // 3. Cleanup function
    return () => {
      console.log("Cleaning up RoomPage effect.");

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log("SSE connection closed.");
      }
    };
  }, [roomCode]);

  if (loading) {
    return <div>Loading room...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!roomData) {
    return <div>Could not find room data.</div>;
  }

  return (
    <div className="space-y-4">
      <RoomInfoCard
        code={roomData.code}
        players={
          roomData.players.length > 0
            ? roomData.players
            : [{ nickname: "Waiting for players..." }]
        }
      />
      <form onSubmit={handleSubmit}>
        <Button type="submit">Start Game</Button>
      </form>
    </div>
  );
}
