import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://34.30.208.141:8080/api",
  headers: {
    "content-type": "application/json",
  },
});

export const quoteApi = axios.create({
  baseURL: "https://api.quotable.kurokeita.dev/api/quotes",
  headers: {
    "content-type": "application/json",
  },
});
