import { useCallback, useEffect, useMemo, useState } from 'react';

const defaultSlots = [
  { id: 'moon', label: 'Лунная дуга' },
  { id: 'water', label: 'Озёрная волна' },
  { id: 'spark', label: 'Искра' },
];

export default function AssemblePuzzle({ puzzle, onSolved }) {
  const [placements, setPlacements] = useState({});
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('Перетащи часть к подходящему месту или нажми часть, а потом место.');
  const slots = puzzle.slots || defaultSlots;

  const placedPieceIds = useMemo(() => Object.values(placements), [placements]);
  const availablePieces = puzzle.pieces.filter((piece) => !placedPieceIds.includes(piece.id));

  const placePiece = useCallback(
    (pieceId, slotId) => {
      if (!pieceId || !slotId || completed) {
        return;
      }

      if (placements[slotId]) {
        setMessage('Это место уже занято. Выбери свободное место ключа.');
        return;
      }

      const piece = puzzle.pieces.find((item) => item.id === pieceId);
      if (piece.slot !== slotId) {
        setMessage('Края не совпали. Попробуй другое место.');
        return;
      }

      setPlacements((current) => ({ ...current, [slotId]: pieceId }));
      setSelectedPiece(null);
      setMessage('Часть легла ровно. Осталось собрать ключ до конца.');
    },
    [completed, placements, puzzle.pieces],
  );

  useEffect(() => {
    if (completed) {
      return;
    }

    if (Object.keys(placements).length === puzzle.pieces.length) {
      setCompleted(true);
      setMessage(puzzle.success);
      window.setTimeout(onSolved, 1000);
    }
  }, [completed, onSolved, placements, puzzle.pieces.length, puzzle.success]);

  useEffect(() => {
    if (!dragging?.pieceId) {
      return undefined;
    }

    const pieceId = dragging.pieceId;

    const handleMove = (event) => {
      setDragging((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current,
      );
    };

    const handleUp = (event) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const slot = target?.closest?.('[data-slot-id]');

      if (slot) {
        placePiece(pieceId, slot.dataset.slotId);
      } else {
        setMessage('Часть выбрана. Теперь нажми подходящее место ключа.');
      }

      setDragging(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging?.pieceId, placePiece]);

  const handlePieceDown = (event, pieceId) => {
    event.preventDefault();
    setSelectedPiece(pieceId);
    setDragging({ pieceId, x: event.clientX, y: event.clientY });
    setMessage('Перенеси часть к месту с похожим краем.');
  };

  const handleSlotClick = (slotId) => {
    if (!selectedPiece) {
      setMessage('Сначала выбери часть ключа.');
      return;
    }
    placePiece(selectedPiece, slotId);
  };

  return (
    <div className="assemble-puzzle">
      <div className="piece-tray">
        {availablePieces.map((piece) => (
          <button
            className={`key-piece piece-${piece.id} ${selectedPiece === piece.id ? 'is-selected' : ''}`}
            key={piece.id}
            type="button"
            onPointerDown={(event) => handlePieceDown(event, piece.id)}
          >
            {piece.title}
          </button>
        ))}
      </div>

      <div className="key-slots">
        {slots.map((slot) => {
          const placedPiece = puzzle.pieces.find((piece) => piece.id === placements[slot.id]);
          return (
            <button
              className={`key-slot slot-${slot.id} ${placedPiece ? 'is-filled' : ''}`}
              key={slot.id}
              type="button"
              data-slot-id={slot.id}
              onClick={() => handleSlotClick(slot.id)}
            >
              {placedPiece ? placedPiece.title : slot.label}
            </button>
          );
        })}
      </div>

      {dragging && (
        <div
          className="drag-ghost"
          style={{ left: `${dragging.x}px`, top: `${dragging.y}px` }}
          aria-hidden="true"
        >
          {puzzle.pieces.find((piece) => piece.id === dragging.pieceId)?.title}
        </div>
      )}

      <p className={`puzzle-message ${completed ? 'success' : ''}`}>{message}</p>
    </div>
  );
}
