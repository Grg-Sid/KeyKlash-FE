import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import GamePage from "./components/game/GamePage";
import { CreateRoomForm } from "./components/room/CreateRoomForm";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-room" element={<CreateRoomForm />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
        <Route path="/room/:roomCode/game" element={<GamePage />} />
        <Route path="/room/game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
