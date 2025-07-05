import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/services/gameService";
import type { Room } from "@/types/Room";
import { generateRandomString } from "@/utils";
import { useState } from "react";

export function CreateRoomForm() {
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMaxPlayers(value);
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
      const text = generateRandomString(1000);
      const room = await createRoom({ maxPlayers, text });
      setRoomData(room);
      alert(`Room created with ID: ${room.id}`);
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}
