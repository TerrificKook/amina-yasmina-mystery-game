import { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import DialogueCard from '../ui/DialogueCard.jsx';
import JournalButton from '../ui/JournalButton.jsx';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';
import PuzzleModal from '../puzzles/PuzzleModal.jsx';

export default function LocationScreen() {
  const { sceneId, character, currentStory, solvedPuzzles, solvePuzzle, nextScene, muted } = useGame();
  const [activePuzzleId, setActivePuzzleId] = useState(null);
  const [note, setNote] = useState('');
  const [abilityUsed, setAbilityUsed] = useState(false);
  const scene = currentStory.scenes.find((item) => item.id === sceneId) || currentStory.scenes[0];
  const hero = currentStory.characters[character] || Object.values(currentStory.characters)[0];
  const sound = useSound(muted);
  const puzzleSolved = Boolean(solvedPuzzles[scene.puzzleId]);

  const lines = useMemo(() => scene.dialogue, [scene]);

  const handleObjectClick = (object) => {
    sound.click();
    if (object.opensPuzzle && !puzzleSolved) {
      setActivePuzzleId(scene.puzzleId);
      return;
    }
    setNote(object.opensPuzzle && puzzleSolved ? scene.solvedNote : object.note);
  };

  const handleAbility = () => {
    sound.click();
    setAbilityUsed(true);
    setNote(scene.insight[character] || scene.insight.amina);
  };

  const handleSolved = () => {
    solvePuzzle(scene.puzzleId);
    sound.success();
    setActivePuzzleId(null);
    setNote(currentStory.puzzles[scene.puzzleId].success);
  };

  const handleNext = () => {
    sound.page();
    setNote('');
    setAbilityUsed(false);
    nextScene();
  };

  return (
    <ParallaxScene type={scene.type}>
      <div className="top-bar">
        <JournalButton />
        <SoundToggle />
      </div>

      <section className="location-panel">
        <p className="eyebrow">Сцена {scene.id} из {currentStory.scenes.length}</p>
        <h1>{scene.title}</h1>
        <p>{scene.subtitle}</p>
      </section>

      <div className={`object-layer ${abilityUsed ? 'ability-active' : ''}`}>
        {scene.objects.map((object) => (
          <button
            className={`scene-marker ${object.opensPuzzle ? 'main-marker' : ''}`}
            key={object.id}
            type="button"
            style={{ left: `${object.x}%`, top: `${object.y}%` }}
            onClick={() => handleObjectClick(object)}
          >
            {object.label}
          </button>
        ))}
      </div>

      <aside className="action-panel">
        <button className="secondary-button" type="button" onClick={handleAbility}>
          {hero.abilityName}
        </button>
        <button
          className="primary-button compact"
          type="button"
          onClick={() => {
            sound.click();
            setActivePuzzleId(scene.puzzleId);
          }}
          disabled={puzzleSolved}
        >
          {puzzleSolved ? 'Загадка решена' : scene.puzzleButton}
        </button>
        <button className="next-button" type="button" onClick={handleNext} disabled={!puzzleSolved}>
          {scene.nextButton}
        </button>
      </aside>

      {note && <div className="note-bubble">{note}</div>}

      <DialogueCard lines={lines} />

      {activePuzzleId && (
        <PuzzleModal
          puzzleId={activePuzzleId}
          onClose={() => setActivePuzzleId(null)}
          onSolved={handleSolved}
        />
      )}
    </ParallaxScene>
  );
}
