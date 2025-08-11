import { joinRoom } from "@/services/gameService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function JoinRoomForm() {
  const [nickname, setNickname] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nickname || !roomCode) {
      setError("Nickname and Room Code are required.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      const player = await joinRoom({ nickname, roomCode });
      localStorage.setItem("playerId", player.id);
      localStorage.setItem("roomCode", roomCode);
      navigate(`/room/${roomCode}`);
    } catch {
      setError("Failed to join. Please check the room code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f0f0]">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Join a Room
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
          />
          <input
            type="text"
            placeholder="Enter room code"
            name="roomCode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition uppercase tracking-widest font-mono"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-semibold text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-400 transition-colors"
          >
            {loading ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
