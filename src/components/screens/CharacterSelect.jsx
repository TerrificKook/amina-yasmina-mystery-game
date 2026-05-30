import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import CharacterSprite from '../ui/CharacterSprite.jsx';
import ParallaxScene from '../ui/ParallaxScene.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

export default function CharacterSelect() {
  const { chooseCharacter, currentStory, muted } = useGame();
  const characterList = useMemo(() => Object.values(currentStory.characters), [currentStory]);
  const [selected, setSelected] = useState(characterList[0].id);
  const sound = useSound(muted);

  useEffect(() => {
    setSelected(characterList[0].id);
  }, [characterList]);

  const handleChoose = () => {
    sound.page();
    chooseCharacter(selected);
  };

  return (
    <ParallaxScene type={currentStory.selectSceneType}>
      <div className="top-bar">
        <SoundToggle />
      </div>
      <section className="select-panel">
        <p className="eyebrow">{currentStory.title}</p>
        <h1>{characterList.length > 1 ? 'Выбери героиню' : 'Главная героиня'}</h1>
        <div className="character-grid">
          {characterList.map((character) => (
            <button
              className={`character-card ${selected === character.id ? 'is-selected' : ''}`}
              key={character.id}
              type="button"
              style={{ '--character-color': character.color }}
              onClick={() => {
                sound.click();
                setSelected(character.id);
              }}
            >
              <span className="character-portrait has-sprite">
                <CharacterSprite characterId={character.id} name={character.name} />
              </span>
              <span className="character-name">{character.name}</span>
              <span className="character-age">{character.age}</span>
              <strong>{character.short}</strong>
              <span>{character.description}</span>
            </button>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={handleChoose}>
          Играть за {(currentStory.characters[selected] || characterList[0]).name}
        </button>
      </section>
    </ParallaxScene>
  );
}
