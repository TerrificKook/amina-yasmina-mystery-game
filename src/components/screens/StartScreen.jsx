import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

export default function StartScreen() {
  const { startGame, muted } = useGame();
  const sound = useSound(muted);

  const handleStart = () => {
    sound.page();
    startGame();
  };

  return (
    <ParallaxScene type="forest">
      <div className="top-bar">
        <SoundToggle />
      </div>
      <section className="hero-panel">
        <p className="eyebrow">Семейная мистическая игра</p>
        <h1>Семейные истории</h1>
        <p>
          Две тёплые сказочные истории про семью, загадки, дневники, яблочный
          сад и маленькие чудеса, которые раскрываются вместе.
        </p>
        <button className="primary-button" type="button" onClick={handleStart}>
          Выбрать историю
        </button>
      </section>
    </ParallaxScene>
  );
}
