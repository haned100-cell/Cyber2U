import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { LearnerDashboard } from './pages/LearnerDashboard';
import { QuizPlayer } from './pages/QuizPlayer';
import { DemoUserBootstrap } from './pages/DemoUserBootstrap';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/demo-user" element={<DemoUserBootstrap />} />
        <Route path="/dashboard" element={<LearnerDashboard />} />
        <Route path="/quiz" element={<QuizPlayer />} />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
