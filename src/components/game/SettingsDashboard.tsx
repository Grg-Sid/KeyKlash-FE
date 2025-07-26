import { ClockIcon, WordsIcon } from "@/assets/icons";
import clsx from "clsx";

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

interface SettingsDashboardProps {
  gameMode: "time" | "words";
  setGameMode: (mode: "time" | "words") => void;
  testDuration: number;
  onDurationChange: (duration: number) => void;
  wordCount: number;
  onWordCountChange: (wordCount: number) => void;
}

export function SettingsDashboard({
  gameMode,
  setGameMode,
  testDuration,
  onDurationChange,
  wordCount,
  onWordCountChange,
}: SettingsDashboardProps) {
  const baseButtonClass =
    "px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-cyan-500 transition-colors duration-200";
  const activeButtonClass =
    "bg-cyan-500 text-white hover:text-white hover:bg-cyan-500";

  const baseTextButtonClass =
    "text-gray-400 hover:text-cyan-500 transition-colors";
  const activeTextButtonClass = "text-cyan-500 font-bold";

  return (
    <div className="p-2 bg-gray-100 rounded-lg flex items-center justify-center gap-4 text-sm font-medium">
      <div className="flex items-center gap-2">
        <button
          className={clsx(baseButtonClass, {
            [activeButtonClass]: gameMode === "time",
          })}
          onClick={() => setGameMode("time")}
        >
          <div className="flex items-center gap-1.5">
            <ClockIcon /> time
          </div>
        </button>
        <button
          className={clsx(baseButtonClass, {
            [activeButtonClass]: gameMode === "words",
          })}
          onClick={() => {
            setGameMode("words");
          }}
        >
          <div className="flex items-center gap-1.5">
            <WordsIcon /> words
          </div>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2"></div>

      <div className="flex items-center gap-4">
        {gameMode === "time" &&
          TIME_OPTIONS.map((time) => (
            <button
              key={time}
              onClick={() => onDurationChange(time)}
              className={clsx(baseTextButtonClass, {
                [activeTextButtonClass]: testDuration === time,
              })}
            >
              {time}
            </button>
          ))}
        {gameMode === "words" &&
          WORD_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => {
                onWordCountChange(count);
              }}
              className={clsx(baseTextButtonClass, {
                [activeTextButtonClass]: wordCount === count,
              })}
            >
              {count}
            </button>
          ))}
      </div>
    </div>
  );
}
