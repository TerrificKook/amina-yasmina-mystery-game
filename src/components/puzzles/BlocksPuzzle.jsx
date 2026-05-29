import { useState } from 'react';

export default function BlocksPuzzle({ puzzle, onSolved }) {
  const [progress, setProgress] = useState([]);
  const [message, setMessage] = useState('Нажимай кубики в порядке садового узора.');
  const [solved, setSolved] = useState(false);

  const handleBlock = (blockId) => {
    if (solved) {
      return;
    }

    const expected = puzzle.sequence[progress.length];
    if (blockId !== expected) {
      setProgress([]);
      setMessage('Узор рассыпался мягкими искрами. Начни с листа.');
      return;
    }

    const nextProgress = [...progress, blockId];
    setProgress(nextProgress);

    if (nextProgress.length === puzzle.sequence.length) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 800);
      return;
    }

    setMessage('Кубик встал ровно. Продолжай узор.');
  };

  return (
    <div className="blocks-puzzle">
      <div className="blocks-grid">
        {puzzle.blocks.map((block) => (
          <button
            className={`garden-block block-${block.id} ${progress.includes(block.id) ? 'is-placed' : ''}`}
            key={block.id}
            type="button"
            onClick={() => handleBlock(block.id)}
          >
            {block.label}
          </button>
        ))}
      </div>
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
