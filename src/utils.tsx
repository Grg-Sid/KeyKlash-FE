import { quoteApi } from "./services/api";

export function getRandomQuote(): Promise<{ quote: { content: string } }> {
  return quoteApi.get("/random?minLength=100&maxLength=300");
}
