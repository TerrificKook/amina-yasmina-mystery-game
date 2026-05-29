import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { useTypewriter } from '../../hooks/useTypewriter.js';

export default function DialogueCard({ lines }) {
  const { currentStory } = useGame();
  const [lineIndex, setLineIndex] = useState(0);
  const currentLine = lines[lineIndex] || lines[0];
  const fallbackSpeaker = { name: currentStory.journalName, color: '#e8b85c' };
  const speaker = currentStory.speakers[currentLine.speaker] || fallbackSpeaker;
  const typedText = useTypewriter(currentLine.text);
  const isLastLine = lineIndex === lines.length - 1;

  useEffect(() => {
    setLineIndex(0);
  }, [lines]);

  const showNextLine = () => {
    if (isLastLine) {
      setLineIndex(0);
      return;
    }
    setLineIndex((current) => current + 1);
  };

  return (
    <section className="dialogue-card" aria-live="polite">
      <div className="speaker-avatar" style={{ '--speaker-color': speaker.color }}>
        {speaker.name.slice(0, 1)}
      </div>
      <div className="dialogue-text">
        <strong style={{ color: speaker.color }}>{speaker.name}</strong>
        <p>{typedText}</p>
      </div>
      <button className="secondary-button" type="button" onClick={showNextLine}>
        {isLastLine ? 'Повторить' : 'Дальше'}
      </button>
    </section>
  );
}
