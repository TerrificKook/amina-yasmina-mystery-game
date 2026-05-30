import { GameProvider, useGame } from './context/GameContext.jsx';
import StartScreen from './components/screens/StartScreen.jsx';
import StorySelect from './components/screens/StorySelect.jsx';
import CharacterSelect from './components/screens/CharacterSelect.jsx';
import ActionGameScreen from './components/screens/ActionGameScreen.jsx';
import LocationScreen from './components/screens/LocationScreen.jsx';
import FinalScreen from './components/screens/FinalScreen.jsx';
import Journal from './components/ui/Journal.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

function GameShell() {
  const { screen } = useGame();

  return (
    <>
      {screen === 'start' && <StartScreen />}
      {screen === 'story' && <StorySelect />}
      {screen === 'select' && <CharacterSelect />}
      {screen === 'action' && <ActionGameScreen />}
      {screen === 'location' && <LocationScreen />}
      {screen === 'final' && <FinalScreen />}
      <Journal />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameShell />
      </GameProvider>
    </ErrorBoundary>
  );
}
