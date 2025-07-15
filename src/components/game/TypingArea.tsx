import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

export type PlayerCursor = {
  playerId: string;
  position: number;
  color: string;
  nickname: string;
};

interface TypingAreaProps {
  text: string;
  myPosition: number;
  myTypedText: string;
  playerCursors?: PlayerCursor[];
  onType: (newPosition: number, typedText: string) => void;
  isGameActive?: boolean;
}

export function TypingArea({
  text,
  myPosition,
  myTypedText,
  playerCursors,
  isGameActive = true,
  onType,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isGameActive) return;

      const newTypedText = e.target.value;

      if (newTypedText.length > text.length) {
        return;
      }

      let newPosition = 0;
      for (let i = 0; i < newTypedText.length; i++) {
        if (newTypedText[i] !== text[i]) {
          break;
        }
        newPosition = i + 1;
      }

      onType(newPosition, newTypedText);
    },
    [isGameActive, text, onType]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        let firstErrorIndex = -1;
        for (let i = 0; i < myTypedText.length; i++) {
          if (myTypedText[i] !== text[i]) {
            firstErrorIndex = i;
            break;
          }
        }

        if (firstErrorIndex === -1) {
          e.preventDefault();
        }
      }
    },
    [myTypedText, text]
  );

  useEffect(() => {
    if (inputRef.current != null) {
      console.log("Input Focused");
      inputRef.current.focus();
    }
    return;
  }, []);

  const renderedText = useMemo(() => {
    return text.split("").map((char, i) => {
      const isTyped = i < myTypedText.length;
      const isCorrect = isTyped && myTypedText[i] === char;
      const isIncorrect = isTyped && myTypedText[i] !== char;

      const charClass = clsx({
        "text-primary font-semibold": isCorrect,
        "text-red-500 bg-red-100": isIncorrect,
        "text-muted-foreground": !isTyped,
      });
      return (
        <span
          key={i}
          className={`relative transition-all duration-75 ${charClass}`}
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
          {(playerCursors ?? []).map((cursor) => {
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
  }, [text, myTypedText, myPosition, playerCursors]);

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.focus()}
        className="bg-background border rounded-xl p-8 shadow-sm font-mono text-2xl leading-relaxed"
      >
        <pre className="whitespace-pre-wrap break-words">{renderedText}</pre>
      </div>
      <input
        type="text"
        ref={inputRef}
        value={myTypedText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full border rounded p-2 font-mono opacity-0"
        placeholder="Start typing here..."
        disabled={!isGameActive}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
