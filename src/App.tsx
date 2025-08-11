import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import GamePage from "./components/game/GamePage";
import { CreateRoomForm } from "./components/room/CreateRoomForm";
import RoomPage from "./pages/RoomPage";
import { JoinRoomForm } from "./components/room/JoinRoomForm";
import Navbar from "./components/game/Navbar";

function AppLayout() {
  const location = useLocation();

  const hideNavbar = location.pathname.includes("/game");

  return (
    <div className="bg-[#f0f0f0] min-h-screen text-[#333] flex flex-col font-sans">
      {!hideNavbar && <Navbar />}
      <div className="flex-1 container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create-room" element={<CreateRoomForm />} />
          <Route path="/join-room" element={<JoinRoomForm />} />
          <Route path="/room/:roomCode" element={<RoomPage />} />
          <Route path="/room/:roomCode/game" element={<GamePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
