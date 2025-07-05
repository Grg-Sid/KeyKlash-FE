import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold mb-2">
          Create Room
          <CreateRoomForm />
        </h2>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">
          Join Room
          <JoinRoomForm />
        </h2>
      </div>
    </div>
  );
}
