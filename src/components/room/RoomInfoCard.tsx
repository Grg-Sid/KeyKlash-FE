import type { Player } from "@/types/Player";
import { getPlayerColor } from "@/utils/getPlayerColor";

interface RoomInfoCardProps {
  code: string;
  players: Player[];
}

export default function RoomInfoCard({ code, players }: RoomInfoCardProps) {
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-400">Room Code</p>
        <div
          onClick={() => navigator.clipboard.writeText(code)}
          className="p-3 mt-1 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
          title="Click to copy"
        >
          <p className="text-3xl font-mono font-bold tracking-widest text-gray-700">
            {code}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Players ({players.length})
        </h3>
        <ul className="space-y-3">
          {players.map((player) => (
            <li key={player.id} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPlayerColor(player.id) }}
              ></span>
              <span className="text-gray-600">{player.nickname}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
