import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2>Page Not Found</h2>
      <p>The experiment you're looking for doesn't exist or has been moved.</p>
      <Link to="/" style={{ 
        marginTop: '2rem',
        backgroundColor: '#3498db',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Return to Experiments
      </Link>
    </div>
  );
};

export default NotFound;