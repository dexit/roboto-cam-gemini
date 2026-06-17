import {useAtom} from 'jotai';
import React, {useEffect} from 'react';
import {Content} from './Content';
import {DetectTypeSelector} from './DetectTypeSelector';
import {ExampleImages} from './ExampleImages';
import {ExtraModeControls} from './ExtraModeControls';
import {Prompt} from './Prompt';
import {SideControls} from './SideControls';
import {TopBar} from './TopBar';
import {InitFinishedAtom, RequestJsonAtom, ResponseJsonAtom, ThemeAtom} from './atoms';

function JsonDisplay() {
  const [requestJson] = useAtom(RequestJsonAtom);
  const [responseJson] = useAtom(ResponseJsonAtom);

  return (
    <div className="flex flex-col w-1/2 p-4 gap-4 overflow-auto border-l h-full">
      <div className="flex flex-col h-1/2">
        <h2 className="text-sm font-bold mb-2 uppercase shrink-0">
          API Request
        </h2>
        <pre
          className="bg-[var(--input-color)] p-2 rounded-md overflow-auto text-xs grow"
          aria-live="polite">
          <code>
            {requestJson || 'Send a request to see the API call details here.'}
          </code>
        </pre>
      </div>
      <div className="flex flex-col h-1/2">
        <h2 className="text-sm font-bold mb-2 uppercase shrink-0">
          API Response
        </h2>
        <pre
          className="bg-[var(--input-color)] p-2 rounded-md overflow-auto text-xs grow"
          aria-live="polite">
          <code>{responseJson}</code>
        </pre>
      </div>
    </div>
  );
}

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
          <JsonDisplay />
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
