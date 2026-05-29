import { useGame } from '../../context/GameContext.jsx';

export default function SoundToggle() {
  const { muted, toggleMute } = useGame();

  return (
    <button className="icon-button" type="button" onClick={toggleMute}>
      {muted ? 'Звук выключен' : 'Звук включён'}
    </button>
  );
}
