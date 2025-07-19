import { commonWords } from "@/data/commonWords";

export function generateRandomWords(count: number): string {
  const wordList = commonWords;
  if (!wordList || wordList.length === 0 || count <= 0) {
    return "Of course. You can create an effective random word generator by writing a simple utility function that pulls words from your list. For efficiency and a better user experience, it's a good practice to ensure you don't pick the same word twice in a row.";
  }
  const randomWords: string[] = [];
  const listLength: number = wordList.length;

  for (let i = 0; i < count; i++) {
    let word: string;

    do {
      const randomIndex = Math.floor(Math.random() * listLength);
      word = wordList[randomIndex];
    } while (i > 0 && word === randomWords[i - 1]);

    randomWords.push(word);
  }

  return randomWords.join(" ");
}
