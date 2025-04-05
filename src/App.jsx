// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import ExperimentLayout from './shared/components/ExperimentLayout';
import NotFound from './shared/components/NotFound';

// Import all experiments
import { experiments } from './experiments/experimentList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {experiments.map((experiment) => (
          <Route 
            key={experiment.id}
            path={`/experiment/${experiment.slug}`}
            element={
              <ExperimentLayout 
                title={experiment.title}
                description={experiment.description}
                Component={experiment.component}
              />
            }
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;