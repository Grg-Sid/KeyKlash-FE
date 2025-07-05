import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayerCursor = {
  playerId: string;
  position: number;
  color: string;
  nickname: string;
  typedText?: string;
};

interface TypingAreaProps {
  text: string;
  myPlayerId?: string;
  myPosition: number;
  playerCursors: PlayerCursor[];
  onType?: (newPosition: number, typedText: string) => void;
  isGameActive?: boolean;
}

export function TypingArea({
  text,
  myPosition,
  playerCursors,
  isGameActive = true,
  onType,
}: TypingAreaProps) {
  const [inputText, setInputText] = useState("");
  const [wrongCharsTyped, setWrongCharsTyped] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isGameActive && inputRef.current) {
      inputRef.current.focus();
      console.log("Input focused");
    }
  });

  const calculatePosition = useCallback(
    (typedValue: string): { position: number; wrongIndices: number[] } => {
      const wrongIndices = [];
      let correctPosition = 0;

      for (let i = 0; i < typedValue.length && i < text.length; i++) {
        if (typedValue[i] === text[i]) {
          if (wrongIndices.length === 0) {
            correctPosition = i + 1;
          }
        } else {
          wrongIndices.push(i);
        }
      }
      return { position: correctPosition, wrongIndices };
    },
    [text]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isGameActive) return;
      const value = e.target.value;

      if (value.length > text.length) {
        return;
      }
      setInputText(value);
      const { position, wrongIndices } = calculatePosition(value);
      setWrongCharsTyped(wrongIndices);
      onType?.(position, value);
    },
    [isGameActive, text.length, calculatePosition, onType]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
      }
      if (e.key === "Backspace") {
        if (wrongCharsTyped.length > 0) {
          return;
        } else {
          e.preventDefault();
        }
      }
    },
    [wrongCharsTyped.length]
  );

  const renderedText = useMemo(() => {
    return text.split("").map((char, i) => {
      const isMine = i < myPosition;
      const isWrong = wrongCharsTyped.includes(i);

      return (
        <span
          key={i}
          className={clsx(
            "relative transition-all duration-75",
            isMine ? "text-primary font-semibold" : "text-muted-foreground",
            isWrong && "text-red-500 bg-red-100"
          )}
        >
          {char}
          {i === myPosition && (
            <span
              className="absolute -bottom-2 left-0 text-xs"
              style={{ color: "black" }}
            >
              ▲
            </span>
          )}
          {playerCursors.map((cursor) => {
            if (cursor.position === i) {
              return (
                <span
                  key={cursor.playerId}
                  className="absolute -bottom-2 left-0 text-xs"
                  style={{ color: cursor.color }}
                >
                  ▲
                </span>
              );
            }
            return null;
          })}
        </span>
      );
    });
  }, [text, myPosition, playerCursors, wrongCharsTyped]);

  return (
    <div className="space-y-4">
      <div className="bg-background border rounded-xl p-4 shadow-sm font-mono text-lg leading-relaxed">
        <pre className="whitespace-pre-wrap break-words">{renderedText}</pre>
      </div>
      <input
        type="text"
        ref={inputRef}
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full border rounded p-2 font-mono opacity-0"
        placeholder="Start typing here..."
      />
    </div>
  );
}
