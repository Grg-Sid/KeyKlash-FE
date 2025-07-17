import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./TypingArea.css";
import { useDebouncedCallback } from "use-debounce";

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
  const [isIdle, setIsIdle] = useState<boolean>(true);

  const debounceSetIdle = useDebouncedCallback(() => {
    setIsIdle(true);
  }, 500);

  const handleTypingActivity = useCallback(() => {
    setIsIdle(false);
    debounceSetIdle();
  }, [debounceSetIdle]);

  const words = useMemo(() => text.split(" "), [text]);

  const activeWordIndex = useMemo(() => {
    return (myTypedText.match(/ /g) || []).length;
  }, [myTypedText]);
  const currentWordInput = useMemo(() => {
    const typedWords = myTypedText.split(" ");
    return typedWords[typedWords.length - 1] || "";
  }, [myTypedText]);

  // Reconstructs the full `myTypedText` string from the current word's input.
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isGameActive) return;
      handleTypingActivity();

      const newCurrentWord = e.target.value;

      if (newCurrentWord.includes(" ")) {
        return;
      }

      const typedWords = myTypedText.split(" ");
      typedWords[activeWordIndex] = newCurrentWord;
      const newTypedText = typedWords.join(" ");

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
    [
      isGameActive,
      handleTypingActivity,
      text,
      onType,
      myTypedText,
      activeWordIndex,
    ]
  );

  // This function now handles advancing to the next word.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === " ") {
        e.preventDefault();

        if (currentWordInput.trim() === "") return;

        if (activeWordIndex >= words.length - 1) return;

        if (currentWordInput.length !== words[activeWordIndex].length) return;

        const newTypedText = myTypedText + " ";

        let newPosition = 0;
        for (let i = 0; i < newTypedText.length; i++) {
          if (newTypedText[i] !== text[i]) {
            break;
          }
          newPosition = i + 1;
        }

        onType(newPosition, newTypedText);
      }

      //TODO: refactor this
      // The old backspace logic is removed. Backspace will now work
      // naturally within the current word's input field.
    },
    [currentWordInput, activeWordIndex, words, myTypedText, onType, text]
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const renderedText = useMemo(() => {
    return text.split("").map((char, i) => {
      const isTyped = i < myTypedText.length;
      const isCorrect = isTyped && myTypedText[i] === char;
      const isIncorrect = isTyped && myTypedText[i] !== char;

      const charClass = clsx({
        "text-primary font-semibold": isCorrect,
        "text-muted-foreground opacity-50": isIncorrect,
        "text-muted-foreground": !isTyped,
      });

      return (
        <span
          key={i}
          className={`relative transition-all duration-75 ${charClass}`}
        >
          {char === " " ? <span>&nbsp;</span> : char}

          {isIncorrect && (
            <span className="absolute -top-1.5 left-0 text-red-500 opacity-90">
              {myTypedText[i] === " " ? <span>&nbsp;</span> : myTypedText[i]}
            </span>
          )}

          {i === myPosition && (
            <span
              className={clsx("absolute right-2 -top-1.5", {
                "cursor-blink": isIdle,
              })}
            >
              |
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
  }, [text, myTypedText, myPosition, isIdle, playerCursors]);

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.focus()}
        className="bg-background border rounded-xl p-8 shadow-sm font-mono text-2xl leading-relaxed cursor-text"
      >
        <div className="whitespace-pre-wrap break-words break-keep">
          {renderedText}
        </div>
      </div>
      <input
        type="text"
        ref={inputRef}
        value={currentWordInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full border rounded p-2 font-mono opacity-0 absolute"
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
