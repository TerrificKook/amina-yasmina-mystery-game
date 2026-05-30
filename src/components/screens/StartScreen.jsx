import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

export default function StartScreen() {
  const { chooseStory, startGame, muted } = useGame();
  const sound = useSound(muted);

  const handleStorySelect = () => {
    sound.page();
    startGame();
  };

  const handlePolinaStart = () => {
    sound.page();
    chooseStory('polina');
  };

  return (
    <ParallaxScene type="old-apple-tree">
      <div className="top-bar">
        <SoundToggle />
      </div>
      <section className="hero-panel hero-panel-apple">
        <p className="eyebrow">Top-down adventure</p>
        <h1>Семейные тайны: дневник и яблоневый сад</h1>
        <p>
          Две истории ведут в разные места: Амина и Яся раскрывают тайну светлячкового дневника, а Полина
          возвращает свет Старой Яблоне. В каждой ветке есть зоны, сбор ключевых предметов, помощники и опасности.
        </p>
        <div className="hero-facts" aria-label="Краткая цель игры">
          <span>2 истории</span>
          <span>несколько зон</span>
          <span>способности героинь</span>
        </div>
        <button className="primary-button" type="button" onClick={handleStorySelect}>
          Выбрать историю
        </button>
        <button className="secondary-button" type="button" onClick={handlePolinaStart}>
          Начать с Полины
        </button>
      </section>
    </ParallaxScene>
  );
}
