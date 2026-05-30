export default function CharacterSprite({ characterId, name }) {
  if (characterId === 'polina' || characterId === 'amina' || characterId === 'yasmina') {
    return (
      <span className={`hero-sprite ${characterId}-sprite`} aria-label={name}>
        <span className="sprite-hair" />
        <span className="sprite-face" />
        {(characterId === 'polina' || characterId === 'yasmina') && <span className="sprite-glasses" />}
        <span className="sprite-body" />
        <span className="sprite-feet" />
      </span>
    );
  }

  return name.slice(0, 1);
}
