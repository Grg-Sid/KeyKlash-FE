import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/services/gameService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateRoomForm() {
  const navigate = useNavigate();

  const [creatorName, setCreatorName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "creatorName") {
      setCreatorName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const room = await createRoom({ creatorName });

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
