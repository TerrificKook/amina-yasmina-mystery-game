import { useState } from 'react';

export default function ApplePuzzle({ puzzle, onSolved }) {
  const [message, setMessage] = useState('Выбери яблочко, которое светится изнутри.');
  const [solved, setSolved] = useState(false);

  const handlePick = (optionId) => {
    if (solved) {
      return;
    }

    if (optionId === puzzle.answer) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 800);
      return;
    }

    setMessage('Это яблочко хорошее, но свет у него обычный. Посмотри на самый тёплый блик.');
  };

  return (
    <div className="apple-puzzle">
      <div className="apple-options">
        {puzzle.options.map((option) => (
          <button
            className={`apple-option apple-${option.id}`}
            key={option.id}
            type="button"
            onClick={() => handlePick(option.id)}
          >
            <span className="apple-shape" aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>
      <span className="tiny-fly" aria-hidden="true" />
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
