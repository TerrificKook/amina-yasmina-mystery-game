import { useState } from 'react';

const threads = [
  { id: 'blue', label: 'Синяя нить', power: 3 },
  { id: 'gold', label: 'Золотая нить', power: 1 },
  { id: 'violet', label: 'Фиолетовая нить', power: 4 },
  { id: 'mint', label: 'Мятная нить', power: 2 },
];

export default function UntiePuzzle({ puzzle, onSolved }) {
  const [progress, setProgress] = useState([]);
  const [message, setMessage] = useState('Начни с самой яркой нити.');
  const [solved, setSolved] = useState(false);

  const handleThread = (threadId) => {
    if (solved) {
      return;
    }

    const expected = puzzle.sequence[progress.length];
    if (threadId !== expected) {
      setProgress([]);
      setMessage('Узел тихо затянулся обратно. Нужен порядок от яркой к тусклой.');
      return;
    }

    const nextProgress = [...progress, threadId];
    setProgress(nextProgress);

    if (nextProgress.length === puzzle.sequence.length) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 900);
      return;
    }

    setMessage('Нить отпустила узел. Продолжай по яркости.');
  };

  return (
    <div className="untie-puzzle">
      {threads.map((thread) => (
        <button
          className={`thread thread-${thread.id} ${progress.includes(thread.id) ? 'is-cut' : ''}`}
          key={thread.id}
          type="button"
          style={{ '--thread-power': thread.power }}
          onClick={() => handleThread(thread.id)}
        >
          {thread.label}
        </button>
      ))}
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
