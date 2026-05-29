import { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import MirrorPuzzle from './MirrorPuzzle.jsx';
import PathPuzzle from './PathPuzzle.jsx';
import CipherPuzzle from './CipherPuzzle.jsx';
import UntiePuzzle from './UntiePuzzle.jsx';
import AssemblePuzzle from './AssemblePuzzle.jsx';
import ApplePuzzle from './ApplePuzzle.jsx';
import BlocksPuzzle from './BlocksPuzzle.jsx';
import DancePuzzle from './DancePuzzle.jsx';
import SymbolsPuzzle from './SymbolsPuzzle.jsx';

const puzzleComponents = {
  mirror: MirrorPuzzle,
  path: PathPuzzle,
  cipher: CipherPuzzle,
  untie: UntiePuzzle,
  assemble: AssemblePuzzle,
  apple: ApplePuzzle,
  blocks: BlocksPuzzle,
  dance: DancePuzzle,
  symbols: SymbolsPuzzle,
};

export default function PuzzleModal({ puzzleId, onClose, onSolved }) {
  const [hintOpen, setHintOpen] = useState(false);
  const { currentStory } = useGame();
  const puzzle = currentStory.puzzles[puzzleId];
  const PuzzleComponent = puzzleComponents[puzzle.type];

  return (
    <div className="modal-backdrop">
      <section className="puzzle-modal" role="dialog" aria-modal="true" aria-label={puzzle.title}>
        <button className="close-button" type="button" onClick={onClose}>
          Закрыть
        </button>
        <p className="eyebrow">Загадка</p>
        <h2>{puzzle.title}</h2>
        <p className="puzzle-question">{puzzle.question}</p>
        <PuzzleComponent puzzle={puzzle} onSolved={onSolved} />
        <div className="hint-panel">
          <button className="secondary-button" type="button" onClick={() => setHintOpen((current) => !current)}>
            {hintOpen ? 'Скрыть подсказку' : 'Подсказка'}
          </button>
          {hintOpen && <p>{puzzle.hint}</p>}
        </div>
      </section>
    </div>
  );
}
