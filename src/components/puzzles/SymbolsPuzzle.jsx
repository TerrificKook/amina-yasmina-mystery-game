import { useState } from 'react';

export default function SymbolsPuzzle({ puzzle, onSolved }) {
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('Выбери только светящиеся символы на коре.');
  const [solved, setSolved] = useState(false);

  const handleSymbol = (symbolId) => {
    if (solved) {
      return;
    }

    if (!puzzle.answers.includes(symbolId)) {
      setSelected([]);
      setMessage('Этот знак не светится через очки. Попробуй снова.');
      return;
    }

    const nextSelected = selected.includes(symbolId)
      ? selected.filter((item) => item !== symbolId)
      : [...selected, symbolId];

    setSelected(nextSelected);

    const allFound =
      nextSelected.length === puzzle.answers.length &&
      puzzle.answers.every((answer) => nextSelected.includes(answer));

    if (allFound) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 800);
      return;
    }

    setMessage('Символ светится. Найди остальные знаки.');
  };

  return (
    <div className="symbols-puzzle">
      <div className="symbols-grid">
        {puzzle.symbols.map((symbol) => (
          <button
            className={`bark-symbol symbol-${symbol.id} ${selected.includes(symbol.id) ? 'is-selected' : ''}`}
            key={symbol.id}
            type="button"
            onClick={() => handleSymbol(symbol.id)}
          >
            {symbol.label}
          </button>
        ))}
      </div>
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
