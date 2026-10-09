import { HashRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store/store';
import { HuddleProvider } from './huddle/Huddle';
import { Toasts } from './components/ui';
import { Launcher } from './surfaces/launcher/Launcher';
import { Explore } from './surfaces/explore/Explore';
import { WebApp } from './surfaces/web/WebApp';
import { CoachApp } from './surfaces/coach/CoachApp';
import { ParentApp } from './surfaces/parent/ParentApp';
import { AthleteApp } from './surfaces/athlete/AthleteApp';
import { UploadSimulator } from './surfaces/coach/Capture';

export function App() {
  return (
    <StoreProvider>
      <HuddleProvider>
        <HashRouter>
          <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
            Skip to content
          </a>
          <Routes>
            <Route path="/" element={<Launcher />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/web/*" element={<WebApp />} />
            <Route path="/coach/*" element={<CoachApp />} />
            <Route path="/parent/*" element={<ParentApp />} />
            <Route path="/athlete/*" element={<AthleteApp />} />
          </Routes>
          <Toasts />
          <UploadSimulator />
        </HashRouter>
      </HuddleProvider>
    </StoreProvider>
  );
}
