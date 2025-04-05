import { useState } from 'react';
import { Link } from 'react-router-dom';
import { experiments } from '../../experiments/experimentList';
import './HomePage.css';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Get all unique tags
  const allTags = [...new Set(experiments.flatMap(exp => exp.tags))];
  
  // Filter experiments based on search and tags
  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
                        selectedTags.every(tag => exp.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });
  
  // Toggle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="home-container">
      <header>
        <h1>Interactive Experiments</h1>
        <p>A collection of my front-end animation and interaction experiments</p>
      </header>
      
      <div className="filters">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search experiments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="tag-filters">
          {allTags.map(tag => (
            <button 
              key={tag}
              className={selectedTags.includes(tag) ? 'tag-button active' : 'tag-button'}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      <div className="experiments-grid">
        {filteredExperiments.map(experiment => (
          <Link 
            to={`/experiment/${experiment.slug}`} 
            className="experiment-card" 
            key={experiment.id}
          >
            <div className="thumbnail">
              <img src={experiment.thumbnail} alt={experiment.title} />
            </div>
            <h3>{experiment.title}</h3>
            <p>{experiment.description}</p>
            <div className="tags">
              {experiment.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))} 
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;