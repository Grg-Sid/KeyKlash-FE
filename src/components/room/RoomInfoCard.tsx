import type { Player } from "@/types/Player";

type RoomInfoCardProps = {
  code: string;
  players: Player[];
};

export default function RoomInfoCard({ code, players }: RoomInfoCardProps) {
  return (
    <div className="border rounded-xl p-4">
      <h3 className="text-lg font-semibold">Room Code: {code}</h3>
      <p className="text-muted-foreground">Players:</p>
      <ul className="list-disc list-inside">
        {players.map((player, index) => (
          <li key={index} className="text-sm text-muted-foreground">
            {player.nickname})
          </li>
        ))}
      </ul>
    </div>
  );
}
