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
  onMount: (ref) => void;
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
  const cursorRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null); // The visible, fixed-height container
  const textContentRef = useRef<HTMLDivElement>(null); // The inner, scrolling content

  const [lineHeight, setLineHeight] = useState(0);
  const [totalLines, setTotalLines] = useState(3);
  const [scrollOffset, setScrollOffset] = useState(0);

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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isGameActive) return;
      handleTypingActivity();
      const newCurrentWord = e.target.value;
      if (newCurrentWord.includes(" ")) return;

      const typedWords = myTypedText.split(" ");
      typedWords[activeWordIndex] = newCurrentWord;

      const newTypedText = typedWords.join(" ");
      if (newTypedText.length > text.length) return;

      onType(newTypedText.length, newTypedText);
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === " ") {
        e.preventDefault();
        if (
          currentWordInput.trim() === "" ||
          activeWordIndex >= words.length - 1 ||
          currentWordInput.length !== words[activeWordIndex].length
        )
          return;
        const newTypedText = myTypedText + " ";
        let newPosition = 0;
        for (let i = 0; i < newTypedText.length; i++) {
          if (newTypedText[i] !== text[i]) break;
          newPosition = i + 1;
        }
        onType(newPosition, newTypedText);
      }
    },
    [currentWordInput, activeWordIndex, words, myTypedText, onType, text]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textContentRef.current) {
      const computedStyle = getComputedStyle(textContentRef.current);
      const lh = parseFloat(computedStyle.lineHeight);
      if (lh > 0) {
        setLineHeight(lh);
        const lines = Math.round(textContentRef.current.scrollHeight / lh);
        setTotalLines(lines);
      }
    }
  }, [text]); // Recalculate if the text changes

  // 2. Effect to update scroll position based on the cursor's current line
  useEffect(() => {
    if (!cursorRef.current || !textContentRef.current || lineHeight === 0) {
      return;
    }
    const cursorParent = cursorRef.current.parentElement;
    if (!cursorParent) return;

    const currentLineTop = cursorParent.offsetTop;
    const currentLineIndex = Math.round(currentLineTop / lineHeight);

    // Scroll so the user's current line becomes the second line in the view
    const newScrollOffset = Math.max(0, currentLineIndex - 1) * lineHeight;
    setScrollOffset(newScrollOffset);
  }, [myPosition, lineHeight]);

  // --- Modified Rendered Text ---
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
              ref={cursorRef} // Attach ref to the cursor to track its position
              className={clsx("absolute right-2 -top-1.5", {
                "cursor-blink": isIdle,
              })}
            >
              |
            </span>
          )}
          {(playerCursors ?? []).map((cursor) =>
            cursor.position === i ? (
              <span
                key={cursor.playerId}
                className="absolute -bottom-2 left-0 text-xs"
                style={{ color: cursor.color }}
              >
                ▲
              </span>
            ) : null
          )}
        </span>
      );
    });
  }, [text, myTypedText, myPosition, isIdle, playerCursors]);

  // --- Modified JSX with Scrolling Container ---
  return (
    <div className="space-y-4">
      <div
        ref={textContainerRef}
        onClick={() => inputRef.current?.focus()}
        className="bg-background border rounded-xl p-8 shadow-sm font-mono text-3xl leading-relaxed cursor-text overflow-hidden"
        style={
          lineHeight > 0
            ? { height: `${lineHeight * Math.min(3, totalLines) + 64}px` } // Height for 3 lines + padding
            : { minHeight: "180px" } // Fallback height
        }
      >
        <div
          ref={textContentRef}
          className="whitespace-pre-wrap break-words break-keep transition-transform duration-200 ease-in-out"
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
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
