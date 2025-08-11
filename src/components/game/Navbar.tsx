import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between p-4 bg-white shadow-md">
      <Link to="/" className="text-2xl font-bold text-cyan-500">
        KeyKlash
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/create-room" className="text-gray-600 hover:text-cyan-500">
          Create Room
        </Link>
        <Link to="/join-room" className="text-gray-600 hover:text-cyan-500">
          Join Room
        </Link>
      </div>
    </header>
  );
}
