import {useAtom} from 'jotai';
import React, {useEffect} from 'react';
import {Content} from './Content';
import {DetectTypeSelector} from './DetectTypeSelector';
import {ExampleImages} from './ExampleImages';
import {ExtraModeControls} from './ExtraModeControls';
import {Prompt} from './Prompt';
import {SideControls} from './SideControls';
import {TopBar} from './TopBar';
import {GasSafeForm} from './GasSafeForm';
import {InitFinishedAtom, ThemeAtom} from './atoms';

function App() {
  const [initFinished] = useAtom(InitFinishedAtom);
  const [theme] = useAtom(ThemeAtom);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex grow flex-col border-b overflow-hidden">
        <TopBar />
        <div className="flex grow overflow-hidden">
          {initFinished ? <Content /> : null}
          <GasSafeForm />
        </div>
        <ExtraModeControls />
      </div>
      <div className="flex shrink-0 w-full overflow-auto py-6 px-5 gap-6 lg:items-start">
        <div className="flex flex-col lg:flex-col gap-6 items-center border-r pr-5">
          <ExampleImages />
          <SideControls />
        </div>
        <div className="flex flex-row gap-6 grow">
          <DetectTypeSelector />
          <Prompt />
        </div>
      </div>
    </div>
  );
}

export default App;
