import { storyList } from '../../data/stories/index.js';
import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

export default function StorySelect() {
  const { chooseStory, muted } = useGame();
  const sound = useSound(muted);

  const handleChoose = (storyId) => {
    sound.page();
    chooseStory(storyId);
  };

  return (
    <ParallaxScene type="forest">
      <div className="top-bar">
        <SoundToggle />
      </div>
      <section className="select-panel story-select-panel">
        <p className="eyebrow">Выбор семейной истории</p>
        <h1>Куда отправимся?</h1>
        <div className="story-grid">
          {storyList.map((story) => (
            <button
              className={`story-card story-card-${story.theme.id}`}
              key={story.id}
              type="button"
              onClick={() => handleChoose(story.id)}
            >
              <span className="story-card-mark">{story.theme.id === 'apple' ? 'Я' : 'Д'}</span>
              <span className="story-card-title">{story.title}</span>
              <span>{story.subtitle}</span>
              <strong>{story.theme.label}</strong>
            </button>
          ))}
        </div>
      </section>
    </ParallaxScene>
  );
}
