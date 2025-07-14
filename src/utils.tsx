import { quoteApi } from "./services/api";

export function getRandomQuote(): Promise<{ quote: { content: string } }> {
  return quoteApi.get("/random?minLength=100&maxLength=300");
}

export function getPlayerColor(playerId: string) {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}
