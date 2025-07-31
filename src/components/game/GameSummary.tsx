import { RefreshCwIcon } from "lucide-react"; // Or use your own icon component

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
  onRestart?: () => void;
}

export function GameSummary({ results, onRestart }: GameSummaryProps) {
  return (
    <div className="w-full max-w-4xl mx-auto text-center p-8 bg-white rounded-xl shadow-md animate-fade-in text-gray-600">
      <div className="flex justify-center items-end gap-12 mb-8">
        <div className="text-center">
          <p className="text-7xl font-bold text-cyan-500">{results.wpm}</p>
          <p className="text-lg">wpm</p>
        </div>
        <div className="text-center pb-2">
          <p className="text-4xl font-bold text-gray-700">
            {results.accuracy.toFixed(1)}%
          </p>
          <p className="text-md">accuracy</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-md mb-10">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-400">raw wpm</p>
          <p className="text-2xl font-semibold text-gray-700">
            {results.rawWpm}
          </p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-400">characters</p>
          <p className="text-2xl font-semibold text-gray-700">
            {results.correctChars} / {results.incorrectChars}
          </p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-400">total chars</p>
          <p className="text-2xl font-semibold text-gray-700">
            {results.totalChars}
          </p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-400">consistency</p>
          <p className="text-2xl font-semibold text-gray-700">N/A</p>{" "}
        </div>
      </div>
      {onRestart ? (
        <button
          onClick={onRestart}
          className="p-3 text-cyan-500 bg-cyan-500/10 rounded-lg font-semibold hover:bg-cyan-500/20 transition-colors"
        >
          <RefreshCwIcon size={24} />
        </button>
      ) : (
        <p className="text-sm text-gray-400 mt-2">
          Waiting for host to restart...
        </p>
      )}
    </div>
  );
}
