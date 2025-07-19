type GameResult = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
};

interface GameSummaryProps {
  results: GameResult;
  onRestart: () => void;
}

/**
 * Displays the final results of the typing test.
 * @param results - The calculated results of the game.
 * @param onRestart - A function to call when the user wants to play again.
 */
export function GameSummary({ results, onRestart }: GameSummaryProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center p-6 bg-card rounded-xl shadow-lg animate-fade-in">
      <h2 className="text-3xl font-bold mb-4">Test Complete!</h2>
      <div className="flex justify-around items-center my-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{results.wpm}</p>
          <p className="text-sm text-muted-foreground">words/min</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-semibold">
            {results.accuracy.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">accuracy</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-6">
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-semibold">Raw WPM</p>
          <p className="text-lg">{results.rawWpm}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-semibold">Characters</p>
          <p className="text-lg">{`${results.correctChars} / ${results.incorrectChars}`}</p>
          <p className="text-xs text-muted-foreground">(correct / incorrect)</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-semibold">Total Typed</p>
          <p className="text-lg">{results.totalChars}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-semibold">Accuracy</p>
          <p className="text-lg">{results.accuracy.toFixed(1)}%</p>
        </div>
      </div>
      <button
        onClick={onRestart}
        className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
