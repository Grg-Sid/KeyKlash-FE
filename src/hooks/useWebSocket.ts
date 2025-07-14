import { Client, type IMessage } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const useWebSocket = (
  roomId: string | null,
  onMessageReceived: (message: any) => void
) => {
  const stompClientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      debug: (str) => console.log(new Date(), str),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        console.log("WebSocket connected");
        client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
          onMessageReceived(JSON.parse(message.body));
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
        console.log("WebSocket connection closed");
      }
    };
  }, [roomId, onMessageReceived]);

  const sendMessage = (destination: string, body: object) => {
    if (stompClientRef.current && isConnected) {
      stompClientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
      console.log("Message sent to", destination, ":", body);
    } else {
      console.warn("WebSocket is not connected. Cannot send message.");
    }
  };

  return {
    isConnected,
    sendMessage,
  };
};
