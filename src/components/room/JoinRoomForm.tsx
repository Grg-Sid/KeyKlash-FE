import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinRoom } from "@/services/gameService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function JoinRoomForm() {
  const [nickname, setNickname] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "nickname") {
      setNickname(value);
    } else if (name === "roomCode") {
      setRoomCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (nickname === "" || roomCode === "") {
      setError("Nickname or Roomcode can not be empty");
      return;
    }

    try {
      setLoading(true);
      console.log("nickname", nickname);
      console.log("roomCode", roomCode);
      const player = await joinRoom({ nickname: nickname, roomCode: roomCode });

      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("playerId", player.id);
      navigate(`/room/${roomCode}`);
    } catch (err) {
      setError("Failed to join the room. Please check Room Code");
      console.error("Create room error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Nickname"
          name="nickname"
          value={nickname}
          onChange={handleChange}
          disabled={loading}
        />
        <Input
          type="text"
          placeholder="Room Code"
          name="roomCode"
          value={roomCode}
          onChange={handleChange}
          disabled={loading}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit">Join Room</Button>
      </form>
    </div>
  );
}
