import { createContext, useContext, useMemo, useState } from 'react';
import { defaultStoryId, stories } from '../data/stories/index.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [screen, setScreen] = useState('start');
  const [storyId, setStoryId] = useState(defaultStoryId);
  const [sceneId, setSceneId] = useState(1);
  const [character, setCharacter] = useState(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalPages, setJournalPages] = useState([stories[defaultStoryId].initialJournalPage]);
  const [solvedPuzzles, setSolvedPuzzles] = useState({});
  const [muted, setMuted] = useState(false);

  const currentStory = stories[storyId] || stories[defaultStoryId];

  const resetProgress = (story) => {
    setSceneId(1);
    setCharacter(null);
    setJournalOpen(false);
    setJournalPages([story.initialJournalPage]);
    setSolvedPuzzles({});
  };

  const startGame = () => setScreen('story');

  const chooseStory = (id) => {
    const selectedStory = stories[id] || stories[defaultStoryId];
    setStoryId(selectedStory.id);
    resetProgress(selectedStory);
    setScreen('select');
  };

  const chooseCharacter = (id) => {
    setCharacter(id);
    setSceneId(1);
    setScreen('action');
  };

  const solvePuzzle = (puzzleId) => {
    if (solvedPuzzles[puzzleId]) {
      return;
    }

    const puzzle = currentStory.puzzles[puzzleId];
    setSolvedPuzzles((current) => ({ ...current, [puzzleId]: true }));
    setJournalPages((current) => {
      if (current.some((page) => page.id === puzzle.journalPage.id)) {
        return current;
      }
      return [...current, puzzle.journalPage];
    });
  };

  const nextScene = () => {
    if (sceneId >= currentStory.scenes.length) {
      setScreen('final');
      return;
    }
    setSceneId((current) => current + 1);
  };

  const finishActionRun = () => {
    setScreen('final');
  };

  const restartStory = () => {
    resetProgress(currentStory);
    setScreen('select');
  };

  const chooseAnotherStory = () => {
    resetProgress(stories[defaultStoryId]);
    setStoryId(defaultStoryId);
    setScreen('story');
  };

  const value = useMemo(
    () => ({
      screen,
      storyId,
      currentStory,
      sceneId,
      character,
      journalOpen,
      journalPages,
      solvedPuzzles,
      muted,
      startGame,
      chooseStory,
      chooseCharacter,
      solvePuzzle,
      nextScene,
      finishActionRun,
      restartStory,
      chooseAnotherStory,
      openJournal: () => setJournalOpen(true),
      closeJournal: () => setJournalOpen(false),
      toggleMute: () => setMuted((current) => !current),
    }),
    [screen, storyId, currentStory, sceneId, character, journalOpen, journalPages, solvedPuzzles, muted],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame должен использоваться внутри GameProvider');
  }
  return context;
}
