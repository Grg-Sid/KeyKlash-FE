import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useMemo } from "react";
import "./TypingArea.css";

export type PlayerCursor = {
  playerId: string;
  position: number;
  color: string;
  nickname: string;
};

interface TypingAreaProps {
  text: string;
  typedText: string;
  playerCursors?: PlayerCursor[];
  onTextChange: (typedText: string) => void;
  onMount: (ref: React.RefObject<HTMLInputElement | null>) => void;
  isGameActive?: boolean;
}

// OPTIMIZATION 1: Create a memoized Character component.
// This prevents re-rendering every single character on each keystroke.
// Only characters whose props change (around the cursor) will re-render.
const Character = React.memo(
  ({
    char,
    isTyped,
    isCorrect,
    hasMyCursor,
    otherCursors,
  }: {
    char: string;
    isTyped: boolean;
    isCorrect: boolean;
    hasMyCursor: boolean;
    otherCursors: PlayerCursor[];
  }) => {
    const charClass = clsx({
      "text-gray-600": isTyped && isCorrect,
      "text-red-500 underline decoration-red-500": isTyped && !isCorrect,
      "text-gray-400": !isTyped,
      caret: hasMyCursor, // OPTIMIZATION 4: Use a CSS class for the cursor
    });

    return (
      <span className="relative">
        <span className={charClass}>{char}</span>
        {otherCursors.map((p) => (
          <span
            key={p.playerId}
            style={{ color: p.color }}
            className="absolute -bottom-2 left-0 text-lg"
            title={p.nickname}
          >
            ▲
          </span>
        ))}
      </span>
    );
  }
);
Character.displayName = "Character";

export function TypingArea({
  text,
  typedText,
  playerCursors = [],
  isGameActive = true,
  onTextChange,
  onMount,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const myPosition = typedText.length;

  useEffect(() => {
    onMount(inputRef);
    if (isGameActive) {
      inputRef.current?.focus();
    }
  }, [onMount, isGameActive]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isGameActive) return;
      const newText = e.target.value;
      if (newText.length > text.length) return;
      onTextChange(newText);
    },
    [isGameActive, text, onTextChange]
  );

  const characters = useMemo(() => text.split(""), [text]);

  // This scrolling logic is now more efficient because it relies on a stable layout
  useEffect(() => {
    const cursorEl = textContentRef.current?.childNodes[
      myPosition
    ] as HTMLElement;
    if (!cursorEl || !textContainerRef.current || !textContentRef.current)
      return;

    const cursorTop = cursorEl.offsetTop;
    const containerHeight = textContainerRef.current.clientHeight;
    const lineHeight = cursorEl.offsetHeight;

    const desiredScrollTop = cursorTop - containerHeight / 2 + lineHeight / 2;

    textContentRef.current.style.transform = `translateY(-${Math.max(
      0,
      desiredScrollTop
    )}px)`;
  }, [myPosition]);

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <div
        ref={textContainerRef}
        className="font-mono text-2xl leading-relaxed cursor-text overflow-hidden h-36"
      >
        <div
          ref={textContentRef}
          className="whitespace-pre-wrap break-words transition-transform duration-200 ease-out"
        >
          {characters.map((char, i) => {
            const isTyped = i < myPosition;
            const isCorrect = char === typedText[i];
            const otherCursorsOnChar = playerCursors.filter(
              (p) => p.position === i
            );

            return (
              <Character
                key={i}
                char={char}
                isTyped={isTyped}
                isCorrect={isCorrect}
                hasMyCursor={i === myPosition}
                otherCursors={otherCursorsOnChar}
              />
            );
          })}
        </div>
      </div>
      <input
        type="text"
        ref={inputRef}
        value={typedText}
        onChange={handleInputChange}
        className="opacity-0 absolute top-0 left-0 w-0 h-0"
        disabled={!isGameActive}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    </div>
  );
}
