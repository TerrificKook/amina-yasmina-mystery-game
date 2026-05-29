import { useState } from 'react';

export default function CipherPuzzle({ puzzle, onSolved }) {
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('Введи слово, которое спряталось в записке.');
  const [solved, setSolved] = useState(false);

  const checkAnswer = (event) => {
    event.preventDefault();

    if (solved) {
      return;
    }

    const normalizedAnswer = answer.trim().toUpperCase();
    if (normalizedAnswer === puzzle.answer) {
      setSolved(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 900);
      return;
    }

    setMessage('Пока не совпало. Сдвинь каждую букву на одну назад по алфавиту.');
  };

  return (
    <form className="cipher-puzzle" onSubmit={checkAnswer}>
      <div className="cipher-note">{puzzle.encoded}</div>
      <label>
        Ответ
        <input
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Например: ОЗЕРО"
          autoComplete="off"
        />
      </label>
      <button className="primary-button compact" type="submit">
        Проверить
      </button>
      <p className={`puzzle-message ${solved ? 'success' : ''}`}>{message}</p>
    </form>
  );
}
