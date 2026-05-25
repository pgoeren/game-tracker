# Game Tracker — Getting Started

## 1. Install Node.js (one time)

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

Or download directly from https://nodejs.org (LTS version).

## 2. Install dependencies

```bash
cd ~/Desktop/Claude/game-tracker
cd server && npm install
cd ../client && npm install
```

## 3. Run the app

Open **two** Terminal tabs:

**Tab 1 — Backend:**
```bash
cd ~/Desktop/Claude/game-tracker/server
node index.js
```

**Tab 2 — Frontend:**
```bash
cd ~/Desktop/Claude/game-tracker/client
npx vite
```

Then open http://localhost:5173 in your browser.

## Usage

1. **Games** → Add the games you play (Catan, Codenames, etc.)
2. **Players** → Add everyone in your group with a color
3. **Sessions** → Log each game night — pick the game, who played, who won
4. **Dashboard** → See leaderboards, win rates, charts, and recent sessions
