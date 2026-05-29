import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import JournalButton from '../ui/JournalButton.jsx';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

export default function FinalScreen() {
  const { currentStory, restartStory, chooseAnotherStory, muted } = useGame();
  const sound = useSound(muted);

  const handleRestartStory = () => {
    sound.page();
    restartStory();
  };

  const handleChooseAnother = () => {
    sound.page();
    chooseAnotherStory();
  };

  return (
    <ParallaxScene type={currentStory.finalSceneType} finale>
      <div className="top-bar">
        <JournalButton />
        <SoundToggle />
      </div>
      <section className="final-panel">
        <p className="eyebrow">{currentStory.ending.eyebrow}</p>
        <h1>{currentStory.ending.title}</h1>
        <p>{currentStory.ending.text}</p>
        <div className="final-glow" aria-hidden="true" />
        <div className="final-actions">
          <button className="primary-button" type="button" onClick={handleRestartStory}>
            Пройти эту историю ещё раз
          </button>
          <button className="secondary-button" type="button" onClick={handleChooseAnother}>
            Выбрать другую историю
          </button>
        </div>
      </section>
    </ParallaxScene>
  );
}
