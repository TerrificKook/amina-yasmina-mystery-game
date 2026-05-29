import { useGame } from '../../context/GameContext.jsx';

export default function JournalButton() {
  const { currentStory, openJournal, journalPages } = useGame();

  return (
    <button className="journal-button" type="button" onClick={openJournal}>
      {currentStory.journalName}
      <span>{journalPages.length}</span>
    </button>
  );
}
