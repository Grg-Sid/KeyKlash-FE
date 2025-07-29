import { createRoom } from "@/services/gameService";
import { generateRandomWords } from "@/utils/wordGenerator";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateRoomForm() {
  const navigate = useNavigate();
  const [creatorName, setCreatorName] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!creatorName) {
      setError("Please enter a name.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      const text = generateRandomWords(wordCount);
      const room = await createRoom({ creatorName, text });
      localStorage.setItem("roomCode", room.code);
      localStorage.setItem("playerId", room.createdBy?.id ?? "");
      navigate(`/room/${room.code}`);
    } catch {
      setError("Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Create Room
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name"
          name="creatorName"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
        />
        <input
          type="number"
          placeholder="Enter your name"
          name="wordCount"
          value={wordCount}
          onChange={(e) => setWordCount(Number(e.target.value))}
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 font-semibold text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Creating..." : "Create and Join"}
        </button>
      </form>
    </div>
  );
}
