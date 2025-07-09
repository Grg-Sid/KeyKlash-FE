import type { RoomCreateRequest } from "../types/RoomCreateRequest";
import type { Room } from "../types/Room";
import type { RoomJoinRequest } from "../types/RoomJoinRequest";
import { api } from "./api";

export const helloWorld = async (): Promise<string> => {
  try {
    const response = await api.get("/hello-world");
    console.log("Response from hello world:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching hello world:", error);
    return "An error occurred";
  }
};

export const testPost = async (): Promise<string> => {
  try {
    const response = await api.post("/test");
    console.log("Response from test post:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in test post:", error);
    return "An error occurred";
  }
};

export const createRoom = async (request: RoomCreateRequest): Promise<Room> => {
  try {
    const response = await api.post<Room>("/room/create", request);
    return response.data;
  } catch (error) {
    console.error("Error creating room:", error);
    throw new Error("Failed to create room");
  }
};

export const joinRoom = async (request: RoomJoinRequest): Promise<Room> => {
  try {
    const response = await api.post<Room>("/room/join", request);
    return response.data;
  } catch (error) {
    console.error("Error joining room:", error);
    throw new Error("Failed to join room");
  }
};

export const getRoom = async (roomId: string): Promise<Room> => {
  try {
    const response = await api.get<Room>(`/room/${roomId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching room:", error);
    throw new Error("Failed to fetch room");
  }
};

export const getRoomByCode = async (roomCode: string): Promise<Room> => {
  try {
    const response = await api.get<Room>(`/room/code/${roomCode}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching room by code:", error);
    throw new Error("Failed to fetch room by code");
  }
};

export const getRooms = async (): Promise<Room[]> => {
  try {
    const response = await api.get<Room[]>("/rooms");
    return response.data;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw new Error("Failed to fetch rooms");
  }
};

export const startGame = async (roomId: string): Promise<Room> => {
  try {
    const response = await api.post<Room>(`/room/${roomId}/start`);
    return response.data;
  } catch (error) {
    console.error("Error starting game:", error);
    throw new Error("Failed to start game");
  }
};
