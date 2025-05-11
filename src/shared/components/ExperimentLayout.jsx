// src/shared/components/ExperimentLayout.jsx
import { Link } from 'react-router-dom';
import './ExperimentLayout.css';

const ExperimentLayout = ({ title, description, Component }) => {
  return (
    // This outer div is mainly for structure and potentially context
    <div className="experiment-layout-fullscreen">

      {/* Render the Component in a dedicated background container */}
      {/* This container will be positioned fixed behind everything else */}
      <div className="experiment-background-canvas">
        <Component />
      </div>

      {/* Header positioned fixed on top */}
      <header className="experiment-header-overlay">
        <Link to="/" className="back-button">← Back to Experiments</Link>
        <div className="experiment-info">
          <h1>{title}</h1>
          {/* Description might be too much for an overlay, consider placement */}
          {/* <p>{description}</p> */}
        </div>
      </header>

      {/* Footer positioned fixed on top */}
      <footer className="experiment-footer-overlay">
        <p>Created with ❤️</p>
        {/* Add other footer content if needed */}
      </footer>

    </div>
  );
};

export default ExperimentLayout;