import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { VerifyEmail } from './pages/VerifyEmail';
import { LearnerDashboard } from './pages/LearnerDashboard';
import { QuizPlayer } from './pages/QuizPlayer';
import { DemoUserBootstrap } from './pages/DemoUserBootstrap';
import './index.css';

const AppShell: React.FC = () => {
  return (
    <>
      <header className="top-nav">
        <span className="top-nav-title">Cyber2U</span>
      </header>
      <Outlet />
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route element={<AppShell />}>
          <Route path="/demo-user" element={<DemoUserBootstrap />} />
          <Route path="/dashboard" element={<LearnerDashboard />} />
          <Route path="/quiz" element={<QuizPlayer />} />
        </Route>
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
