import { useState } from 'react';

const items = [
  { id: 'lamp', label: 'Лампа' },
  { id: 'mirror', label: 'Зеркальце' },
  { id: 'coin', label: 'Старая монета' },
  { id: 'window', label: 'Окно' },
];

export default function MirrorPuzzle({ puzzle, onSolved }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('Сначала выбери предмет, который возвращает свет.');
  const [solved, setSolved] = useState(false);

  const handlePick = (itemId) => {
    if (solved) {
      return;
    }

    if (!selected) {
      if (itemId === 'mirror') {
        setSelected('mirror');
        setMessage('Зеркальце поймало луч. Теперь направь его к лампе.');
      } else {
        setMessage('Похоже, это не тот предмет. Он должен отражать свет.');
      }
      return;
    }

    if (selected === 'mirror' && itemId === 'lamp') {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 900);
      return;
    }

    setMessage('Луч ушёл в сторону. Попробуй: зеркальце, потом лампа.');
  };

  return (
    <div className="mirror-puzzle">
      <div className="light-beam" aria-hidden="true" />
      <div className="puzzle-choice-grid">
        {items.map((item) => (
          <button
            className={`puzzle-choice ${selected === item.id ? 'is-selected' : ''}`}
            key={item.id}
            type="button"
            onClick={() => handlePick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
