import { useEffect, useState } from "react";
import { TypingArea, type PlayerCursor } from "./TypingArea";

const sampleText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const mockPlayers: PlayerCursor[] = [
  {
    playerId: "1",
    position: 10,
    color: "red",
    nickname: "Player1",
  },
  {
    playerId: "2",
    position: 20,
    color: "blue",
    nickname: "Player2",
  },
  {
    playerId: "3",
    position: 15,
    color: "green",
    nickname: "Player3",
  },
];

export default function GamePage() {
  const [myPosition, setMyPosition] = useState(0);
  const [playerCursors, setPlayerCursors] =
    useState<PlayerCursor[]>(mockPlayers);
  const onType = (newPosition: number, typedText: string) => {
    setMyPosition(newPosition);
    console.log(`Typed text: ${typedText}, New position: ${newPosition}`);
  };

  // This simulates the movement of player cursors over time.
  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       setPlayerCursors((prev) =>
  //         prev.map((player) => ({
  //           ...player,
  //           position: Math.min(player.position + 1, sampleText.length),
  //         }))
  //       );
  //     }, 1000);

  //     return () => clearInterval(interval);
  //   }, []);

  return (
    <TypingArea
      text={sampleText}
      myPosition={myPosition}
      playerCursors={playerCursors}
      onType={onType}
    />
  );
}
