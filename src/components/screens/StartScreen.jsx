import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

export default function StartScreen() {
  const { chooseStory, startGame, muted } = useGame();
  const sound = useSound(muted);

  const handleStart = () => {
    sound.page();
    chooseStory('polina');
  };

  const handleStorySelect = () => {
    sound.page();
    startGame();
  };

  return (
    <ParallaxScene type="old-apple-tree">
      <div className="top-bar">
        <SoundToggle />
      </div>
      <section className="hero-panel hero-panel-apple">
        <p className="eyebrow">Top-down adventure</p>
        <h1>Полина и Тайна Старой Яблони</h1>
        <p>
          Ночной сад потерял свет. Полине нужно найти три части ключа,
          пройти через поляны и лабиринт, а потом разбудить Старую Яблоню.
        </p>
        <div className="hero-facts" aria-label="Краткая цель игры">
          <span>4 зоны</span>
          <span>3 части ключа</span>
          <span>Очки и рывок</span>
        </div>
        <button className="primary-button" type="button" onClick={handleStart}>
          Начать приключение
        </button>
        <button className="secondary-button" type="button" onClick={handleStorySelect}>
          Выбрать другую историю
        </button>
      </section>
    </ParallaxScene>
  );
}
