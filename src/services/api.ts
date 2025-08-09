import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
console.log("API URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL + "/api",
  headers: {
    "content-type": "application/json",
  },
});
