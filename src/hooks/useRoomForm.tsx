import { useState } from "react";

export const useRoomForm = () => {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value);
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  return {
    roomCode,
    nickname,
    handleRoomCodeChange,
    handleNicknameChange,
  };
};
