import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { SinglePlayerGame } from "./SingleplayerGame";
import { MultiplayerGame } from "./MultiplayerGame";

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode?: string }>();

  const myPlayerId = useMemo(() => {
    let pid = localStorage.getItem("playerId");
    if (!pid) {
      pid = `local-player-${Date.now()}`;
      localStorage.setItem("playerId", pid);
    }
    return pid;
  }, []);

  return (
    <div className="bg-[#f0f0f0] min-h-screen text-[#333] flex flex-col font-sans">
      <header className="px-12 py-3">{/* Header Content */}</header>
      <main className="flex-grow flex flex-col items-center justify-center -mt-16 px-4">
        {roomCode ? (
          <MultiplayerGame roomCode={roomCode} myPlayerId={myPlayerId} />
        ) : (
          <SinglePlayerGame myPlayerId={myPlayerId} />
        )}
      </main>
    </div>
  );
}
