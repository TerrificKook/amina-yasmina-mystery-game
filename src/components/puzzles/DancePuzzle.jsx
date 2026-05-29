import { useState } from 'react';

export default function DancePuzzle({ puzzle, onSolved }) {
  const [progress, setProgress] = useState([]);
  const [message, setMessage] = useState('Повтори ритм котиков-смотрителей.');
  const [solved, setSolved] = useState(false);

  const handleMove = (moveId) => {
    if (solved) {
      return;
    }

    const expected = puzzle.sequence[progress.length];
    if (moveId !== expected) {
      setProgress([]);
      setMessage('Котики вежливо моргнули: ритм сбился. Начни с хлопка.');
      return;
    }

    const nextProgress = [...progress, moveId];
    setProgress(nextProgress);

    if (nextProgress.length === puzzle.sequence.length) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 800);
      return;
    }

    setMessage('Шаг принят. Котики слушают дальше.');
  };

  return (
    <div className="dance-puzzle">
      <div className="dance-sequence">
        <span>Хлопок</span>
        <span>Вправо</span>
        <span>Влево</span>
        <span>Поклон</span>
      </div>
      <div className="dance-grid">
        {puzzle.moves.map((move) => (
          <button
            className={`dance-move move-${move.id} ${progress.includes(move.id) ? 'is-done' : ''}`}
            key={move.id}
            type="button"
            onClick={() => handleMove(move.id)}
          >
            {move.label}
          </button>
        ))}
      </div>
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
