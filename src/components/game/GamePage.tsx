import { useEffect, useState } from "react";
import { TypingArea, type PlayerCursor } from "./TypingArea";
import type { Room } from "@/types/Room";
import { getRoomByCode } from "@/services/gameService";

const sampleText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const mockPlayers: PlayerCursor[] = [
  {
    playerId: "1",
    position: 10,
    color: "red",
    nickname: "Player1",
  },
  {
    playerId: "2",
    position: 20,
    color: "blue",
    nickname: "Player2",
  },
  {
    playerId: "3",
    position: 15,
    color: "green",
    nickname: "Player3",
  },
];

export default function GamePage() {
  const roomCode = localStorage.getItem("roomCode");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [myPosition, setMyPosition] = useState(0);
  const [playerCursors, setPlayerCursors] =
    useState<PlayerCursor[]>(mockPlayers);

  const onType = (newPosition: number) => {
    setMyPosition(newPosition);
  };

  // This simulates the movement of player cursors over time.
  useEffect(() => {
    if (!roomCode) {
      console.error("Room Code not found in localStorage");
      return;
    }
    const fetchRoomData = async () => {
      try {
        const room: Room = await getRoomByCode(roomCode);
        console.log("Fetched room data:", room);

        setRoomData(room);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    const interval = setInterval(() => {
      setPlayerCursors((prev) =>
        prev.map((player) => ({
          ...player,
          position: Math.min(
            player.position + 1,
            roomData?.text.length || sampleText.length
          ),
        }))
      );
    }, 1000);

    fetchRoomData();
    setIsLoading(false);
    return () => clearInterval(interval);
  }, [roomCode, roomData?.text]);

  return (
    <div className="game-page">
      <h1 className="text-2xl font-bold mb-4">Game Room</h1>
      <p className="mb-4">Room Code: {roomCode}</p>
      <TypingArea
        text={roomData?.text || sampleText}
        myPosition={myPosition}
        playerCursors={playerCursors}
        onType={onType}
      />
      <div className="player-cursors mt-4">
        <h2 className="text-xl font-semibold">Player Cursors</h2>
        <ul className="list-disc pl-5">
          {playerCursors.map((player) => (
            <li key={player.playerId}>
              {player.nickname} - Position: {player.position}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
