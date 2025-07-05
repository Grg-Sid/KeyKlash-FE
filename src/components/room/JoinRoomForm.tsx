import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinRoomForm() {
  return (
    <div>
      <form className="space-y-4">
        <Input placeholder="Nickname"></Input>
        <Input placeholder="Room Code"></Input>
        <Button type="submit">Join Room</Button>
      </form>
    </div>
  );
}
