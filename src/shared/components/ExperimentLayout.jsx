// src/shared/components/ExperimentLayout.jsx
import { Link } from 'react-router-dom';
import './ExperimentLayout.css';

const ExperimentLayout = ({ title, description, Component }) => {
  return (
    <div className="experiment-layout">
      <header className="experiment-header">
        <Link to="/" className="back-button">← Back to Experiments</Link>
        <div className="experiment-info">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      
      <main className="experiment-container">
        <Component />
      </main>
      
      <footer className="experiment-footer">
        <p>Created with ❤️</p>
      </footer>
    </div>
  );
};

export default ExperimentLayout;