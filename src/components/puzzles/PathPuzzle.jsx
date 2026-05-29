import { useState } from 'react';

const stones = [1, 2, 3, 4, 5, 6];

export default function PathPuzzle({ puzzle, onSolved }) {
  const [progress, setProgress] = useState([]);
  const [message, setMessage] = useState('Фонарник ждёт: начни с первого тёплого камня.');
  const [solved, setSolved] = useState(false);

  const handleStone = (stone) => {
    if (solved) {
      return;
    }

    const expected = puzzle.sequence[progress.length];
    if (stone !== expected) {
      setProgress([]);
      setMessage('Камень холодный. Тропа мягко погасла, можно начать заново.');
      return;
    }

    const nextProgress = [...progress, stone];
    setProgress(nextProgress);

    if (nextProgress.length === puzzle.sequence.length) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 900);
      return;
    }

    setMessage('Камень тёплый. Продолжай по светлой дорожке.');
  };

  return (
    <div className="path-puzzle">
      <div className="stone-row">
        {stones.map((stone) => {
          const isWarm = puzzle.sequence.includes(stone);
          const isPressed = progress.includes(stone);

          return (
            <button
              className={`stone ${isWarm ? 'warm' : 'cold'} ${isPressed ? 'is-pressed' : ''}`}
              key={stone}
              type="button"
              onClick={() => handleStone(stone)}
            >
              {stone}
            </button>
          );
        })}
      </div>
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
