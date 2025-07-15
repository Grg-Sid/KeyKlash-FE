import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/services/gameService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateRoomForm() {
  const navigate = useNavigate();

  const [creatorName, setCreatorName] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "maxPlayers") {
      const parsedValue = parseInt(value, 10);
      if (!isNaN(parsedValue)) {
        setMaxPlayers(parsedValue);
      }
    } else if (name === "creatorName") {
      setCreatorName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (maxPlayers < 2 || maxPlayers > 20) {
      setError("Max players must be between 2 and 20");
      return;
    }

    try {
      setLoading(true);
      const room = await createRoom({ maxPlayers, creatorName });

      localStorage.setItem("roomCode", room.code);
      localStorage.setItem("playerId", room.createdBy?.id ?? "");

      navigate(`/room/${room.code}`);
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error("Create room error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        type="number"
        placeholder="Max players"
        name="maxPlayers"
        min={2}
        max={20}
        value={maxPlayers}
        onChange={handleChange}
        disabled={loading}
      />
      <Input
        type="text"
        placeholder="Name"
        name="creatorName"
        value={creatorName}
        onChange={handleChange}
        disabled={loading}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}
