import RoomInfoCard from "@/components/room/RoomInfoCard";
import { Button } from "@/components/ui/button";

export default function RoomPage() {
  return (
    <div className="space-y-4">
      <RoomInfoCard code="ABCD" players={["a", "b", "c"]} />
      <Button>Start Game </Button>
    </div>
  );
}
