# KeyKlash

KeyKlash is a web-based typing game designed to test and improve your typing speed and accuracy. It features both single-player and multiplayer modes, allowing you to challenge yourself or compete with friends in real-time.

**Live Demo:** [https://keyklash.grg-sid.fyi/](https://keyklash.grg-sid.fyi/)

-----

## Screenshots

<img width="1919" height="971" alt="image" src="https://github.com/user-attachments/assets/6e2ea923-f6e7-4d4f-80e1-1fa31fe2525b" />

<img width="1918" height="971" alt="image" src="https://github.com/user-attachments/assets/e67b84d1-99bf-4373-a03c-f95e70123181" />

<img width="1914" height="983" alt="image" src="https://github.com/user-attachments/assets/674d0e29-90dc-4c84-8935-45b166d81c44" />

-----

## Features

  * **Single-Player Mode**: Practice on your own with customizable game settings.
      * **Game Modes**: Choose between "time" or "words" based challenges.
      * **Customizable Goals**: Set the test duration or the number of words for your practice session.
  * **Multiplayer Mode**: Create or join rooms to compete with friends.
      * **Real-time Progress**: See your opponents' progress in real-time as you type.
      * **Game Host Controls**: The creator of the room can start the game.
  * **Game Summary**: After each game, get a detailed summary of your performance, including:
      * Words Per Minute (WPM)
      * Raw WPM
      * Accuracy
      * Character stats (correct, incorrect, and total)

-----

## Technologies Used

This project is built with a modern web development stack:

  * **Frontend**: React, TypeScript, Vite
  * **Styling**: Tailwind CSS
  * **Real-time Communication**: WebSockets using StompJS and SockJS
  * **Routing**: React Router
  * **Linting**: ESLint

-----

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

  * Node.js (v18.18.0 or later)
  * npm

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/KeyKlash-FE.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Start the development server
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

-----

## Project Structure

```
KeyKlash-FE/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── game/
│   │   ├── room/
│   │   └── ui/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

  * **`src/components`**: Contains reusable UI components. The `game` and `room` subdirectories hold components specific to those features.
  * **`src/pages`**: Contains the main pages of the application, such as `HomePage`, `RoomPage`, and the game page.
  * **`src/hooks`**: Custom hooks, like `useWebSocket` for managing WebSocket connections.
  * **`src/services`**: Functions for interacting with the backend API, such as creating and joining rooms.
  * **`src/types`**: TypeScript type definitions for data structures like `Player`, `Room`, and `GameMessage`.

-----

## Future Improvements

  * **User Accounts**: Implement user authentication to save game history and track progress over time.
  * **Leaderboards**: Add global and friend-based leaderboards to foster competition.
  * **More Game Modes**: Introduce new game modes, such as typing against a "ghost" of a previous performance.
  * **Themes**: Allow users to customize the look and feel of the typing interface.
