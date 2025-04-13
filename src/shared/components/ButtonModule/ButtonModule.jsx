import React, { useState } from 'react';
import { Group, Button as MantineButton, Tooltip, Badge, ActionIcon, ThemeIcon, Avatar, Indicator, RingProgress, Progress } from '@mantine/core';
import { IconBeach, IconBulb, IconCode, IconPalette, IconRocket, IconWand, IconDots, IconArrowRight, IconStar, IconHeart, IconBrain, IconFlame, IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '../../context/ThemeContext';
import './ButtonModule.css';

// Pretend imports from multiple UI libraries - in a real app you'd need to install these
// These are mock components that simulate the different libraries
const MockBootstrapButton = ({ variant, onClick, size, children, className }) => (
  <button className={`btn btn-${variant} btn-${size} ${className || ''}`} onClick={onClick}>
    {children}
  </button>
);

const MockMaterialButton = ({ color, variant, onClick, size, children, startIcon }) => (
  <button 
    className={`mui-button mui-${variant} mui-${color} mui-${size}`} 
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
  >
    {startIcon && <span className="mui-icon">{startIcon}</span>}
    <span>{children}</span>
  </button>
);

const MockChakraButton = ({ colorScheme, onClick, size, children, leftIcon }) => (
  <button 
    className={`chakra-button chakra-${colorScheme} chakra-${size}`} 
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
  >
    {leftIcon && <span className="chakra-button__icon">{leftIcon}</span>}
    <span>{children}</span>
  </button>
);

// Additional mocked components
const MockSemanticButton = ({ fluid, size, color, circular, icon, onClick }) => (
  <button 
    className={`semantic-button semantic-${size} semantic-${color} ${circular ? 'semantic-circular' : ''} ${fluid ? 'semantic-fluid' : ''}`}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    {icon && <span className="semantic-icon">{icon}</span>}
  </button>
);

const MockNeoButton = ({ glow, size, onClick }) => (
  <button 
    className={`neo-button neo-${size} ${glow ? 'neo-glow' : ''}`}
    onClick={onClick}
  >
    {glow ? '✧' : '•'}
  </button>
);

const MockFuturisticToggle = ({ active, onClick }) => (
  <div 
    className={`futuristic-toggle ${active ? 'futuristic-active' : ''}`}
    onClick={onClick}
  >
    <div className="futuristic-toggle-handle"></div>
  </div>
);

const MockCommandButton = ({ onClick }) => (
  <div className="mock-command-button" onClick={onClick}>
    <span className="mock-command-symbol">⌘</span>
  </div>
);

const MockTerminalButton = ({ onClick, isActive }) => (
  <div className={`mock-terminal-button ${isActive ? 'mock-terminal-active' : ''}`} onClick={onClick}>
    <div className="mock-terminal-line"></div>
  </div>
);

const MockGlitchButton = ({ onClick, text }) => (
  <div className="mock-glitch-button" onClick={onClick} data-text={text}>
    {text}
  </div>
);

const ButtonModule = ({ onCategorySelect }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const { theme, toggleTheme } = useTheme();
  
  const categories = [
    { 
      id: 'creative', 
      label: 'Creative', 
      icon: <IconPalette size={16} />, 
      color: 'pink', 
      tooltip: 'Artistic and creative experiments' 
    },
    { 
      id: 'interactive', 
      label: 'Interactive', 
      icon: <IconBeach size={16} />, 
      color: 'blue', 
      tooltip: 'Interactive and engaging experiments' 
    },
    { 
      id: 'tech', 
      label: 'Technical', 
      icon: <IconCode size={16} />, 
      color: 'violet', 
      tooltip: 'Technical and code-focused experiments' 
    },
    { 
      id: 'fun', 
      label: 'Fun', 
      icon: <IconBulb size={16} />, 
      color: 'yellow', 
      tooltip: 'Fun and entertaining experiments' 
    },
    { 
      id: 'new', 
      label: 'New', 
      icon: <IconRocket size={16} />, 
      color: 'green', 
      tooltip: 'Latest experiments' 
    },
  ];

  const handleCategoryClick = (categoryId) => {
    const newCategory = activeCategory === categoryId ? null : categoryId;
    setActiveCategory(newCategory);
    if (onCategorySelect) {
      onCategorySelect(newCategory);
    }
  };

  // Absurdly small emoji button
  const TinyEmojiButton = ({ emoji, onClick, isActive }) => (
    <button 
      onClick={onClick} 
      style={{ 
        fontSize: '14px', 
        width: '22px', 
        height: '22px', 
        padding: 0,
        backgroundColor: isActive ? '#e2e8f0' : 'transparent',
        border: isActive ? '1px solid #cbd5e0' : '1px solid transparent',
        borderRadius: '50%',
        cursor: 'pointer'
      }}
    >
      {emoji}
    </button>
  );

  // Ridiculously small HTML button
  const MiniHTMLButton = ({ text, onClick, isActive }) => (
    <button 
      onClick={onClick} 
      style={{
        fontSize: '8px',
        padding: '1px 3px', 
        backgroundColor: isActive ? '#fed7aa' : '#fff',
        border: '1px dotted #f97316',
        borderRadius: '2px',
        cursor: 'pointer'
      }}
    >
      {text}
    </button>
  );

  // Tiny chip button
  const TinyChip = ({ label, color, onClick, isActive }) => (
    <div 
      onClick={onClick} 
      className={`tiny-chip ${isActive ? 'tiny-chip-active' : ''}`}
      style={{
        backgroundColor: isActive ? color : 'transparent',
        borderColor: color,
        color: isActive ? 'white' : color
      }}
    >
      {label}
    </div>
  );

  // 3D Button that's actually flat
  const FakePseudo3DButton = ({ text, onClick, isActive }) => (
    <button 
      onClick={onClick} 
      className={`fake-3d-button ${isActive ? 'fake-3d-active' : ''}`}
    >
      {text}
    </button>
  );

  // Vintage Windows 95 style button
  const Win95Button = ({ text, onClick, isActive }) => (
    <button 
      onClick={onClick} 
      className={`win95-button ${isActive ? 'win95-active' : ''}`}
    >
      {text}
    </button>
  );

  // Single pixel button (almost impossible to click)
  const PixelButton = ({ color, onClick }) => (
    <div 
      onClick={onClick}
      style={{
        width: '2px',
        height: '2px',
        backgroundColor: color,
        cursor: 'pointer',
        border: '1px solid #ddd'
      }}
      title="Pixel Button"
    ></div>
  );

  // Circular progress as button
  const ProgressButton = ({ value, onClick, isActive }) => (
    <div 
      onClick={onClick} 
      style={{ cursor: 'pointer' }}
    >
      <RingProgress
        size={24}
        thickness={3}
        roundCaps
        sections={[{ value, color: isActive ? 'teal' : 'gray' }]}
      />
    </div>
  );
  
  // Keyboard key button
  const KeyCapButton = ({ letter, onClick, isActive }) => (
    <div 
      className={`key-cap-button ${isActive ? 'key-cap-active' : ''}`}
      onClick={onClick}
    >
      {letter}
    </div>
  );

  // Retro LCD segment display
  const LCDSegmentButton = ({ digit, onClick, isActive }) => (
    <div 
      className={`lcd-segment ${isActive ? 'lcd-segment-active' : ''}`}
      onClick={onClick}
    >
      {digit}
    </div>
  );

  const getRandomEmoji = (id) => {
    const emojis = {
      'creative': '🎨',
      'interactive': '🏄',
      'tech': '💻',
      'fun': '💡',
      'new': '🚀'
    };
    return emojis[id] || '✨';
  };

  return (
    <div className="button-container">
      {/* Theme Toggle Button - First button */}
      <Tooltip 
        label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} 
        position="bottom"
        withArrow
      >
        <ActionIcon
          variant="light"
          color={theme === 'light' ? 'yellow' : 'blue'}
          onClick={toggleTheme}
          size="md"
          className="theme-button"
        >
          {theme === 'light' 
            ? <IconSun size={16} /> 
            : <IconMoon size={16} />
          }
        </ActionIcon>
      </Tooltip>
      
      {/* Mantine Button */}
      <Tooltip 
        label={categories[0].tooltip} 
        position="bottom"
        withArrow
      >
        <MantineButton
          variant={activeCategory === categories[0].id ? "filled" : "light"}
          color={categories[0].color}
          className={`category-button ${activeCategory === categories[0].id ? 'active' : ''}`}
          onClick={() => handleCategoryClick(categories[0].id)}
          leftSection={categories[0].icon}
          size="xs"
          radius="xl"
        >
          {categories[0].label}
        </MantineButton>
      </Tooltip>
      
      {/* Mantine ActionIcon */}
      <Tooltip label={categories[1].tooltip} position="bottom" withArrow>
        <ActionIcon
          variant={activeCategory === categories[1].id ? "filled" : "light"}
          color={categories[1].color}
          onClick={() => handleCategoryClick(categories[1].id)}
          size="md"
        >
          {categories[1].icon}
        </ActionIcon>
      </Tooltip>
      
      {/* Mock Bootstrap Button */}
      <Tooltip label={categories[2].tooltip} position="bottom" withArrow>
        <MockBootstrapButton
          variant={activeCategory === categories[2].id ? "primary" : "outline-primary"}
          size="sm"
          onClick={() => handleCategoryClick(categories[2].id)}
          className="tiny-button"
        >
          {categories[2].icon} {categories[2].label}
        </MockBootstrapButton>
      </Tooltip>
      
      {/* Tiny Emoji Button */}
      <Tooltip label={categories[3].tooltip} position="bottom" withArrow>
        <TinyEmojiButton
          emoji={getRandomEmoji(categories[3].id)}
          onClick={() => handleCategoryClick(categories[3].id)}
          isActive={activeCategory === categories[3].id}
        />
      </Tooltip>
      
      {/* Mock Material Button */}
      <Tooltip label={categories[4].tooltip} position="bottom" withArrow>
        <MockMaterialButton
          color="success"
          variant={activeCategory === categories[4].id ? "contained" : "outlined"}
          onClick={() => handleCategoryClick(categories[4].id)}
          size="small"
          startIcon={categories[4].icon}
        >
          {categories[4].label}
        </MockMaterialButton>
      </Tooltip>

      {/* Badge as button - comically small */}
      <Tooltip label="Mystery category" position="bottom" withArrow>
        <Badge 
          color="grape" 
          size="xs" 
          variant="dot" 
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryClick('mystery')}
        >
          ?
        </Badge>
      </Tooltip>
      
      {/* Mini HTML Button */}
      <Tooltip label="Tiny category" position="bottom" withArrow>
        <MiniHTMLButton
          text="tiny"
          onClick={() => handleCategoryClick('tiny')}
          isActive={activeCategory === 'tiny'}
        />
      </Tooltip>
      
      {/* Mock Chakra Button */}
      <Tooltip label="Cosmic category" position="bottom" withArrow>
        <MockChakraButton
          colorScheme="purple"
          size="xs"
          onClick={() => handleCategoryClick('cosmic')}
          leftIcon={<span style={{ fontSize: '10px' }}>✨</span>}
        >
          Cosmic
        </MockChakraButton>
      </Tooltip>

      {/* New absurd buttons */}
      {/* Tiny Chip */}
      <Tooltip label="Microscopic chip" position="bottom" withArrow>
        <TinyChip
          label="µ"
          color="#fc5c9c"
          onClick={() => handleCategoryClick('micro')}
          isActive={activeCategory === 'micro'}
        />
      </Tooltip>

      {/* Windows 95 Button */}
      <Tooltip label="Retro experience" position="bottom" withArrow>
        <Win95Button
          text="DOS"
          onClick={() => handleCategoryClick('retro')}
          isActive={activeCategory === 'retro'}
        />
      </Tooltip>

      {/* Single Pixel Button */}
      <Tooltip label="Pixel perfect" position="bottom" withArrow>
        <div style={{ padding: '5px' }}>
          <PixelButton
            color="#ff0000"
            onClick={() => handleCategoryClick('pixel')}
          />
        </div>
      </Tooltip>

      {/* Mock Semantic Circular Button */}
      <Tooltip label="Round category" position="bottom" withArrow>
        <MockSemanticButton
          circular
          size="mini"
          color="teal"
          icon="O"
          onClick={() => handleCategoryClick('round')}
        />
      </Tooltip>

      {/* Faux 3D button */}
      <Tooltip label="Pseudo 3D" position="bottom" withArrow>
        <FakePseudo3DButton
          text="3D"
          onClick={() => handleCategoryClick('3d')}
          isActive={activeCategory === '3d'}
        />
      </Tooltip>

      {/* Neon glow button */}
      <Tooltip label="Neon category" position="bottom" withArrow>
        <MockNeoButton
          glow={activeCategory === 'neon'}
          size="xs"
          onClick={() => handleCategoryClick('neon')}
        />
      </Tooltip>

      {/* Mantine ThemeIcon as button */}
      <Tooltip label="Magical category" position="bottom" withArrow>
        <ThemeIcon 
          variant="light"
          color="grape" 
          size="sm"
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryClick('magic')}
        >
          <IconWand size={10} />
        </ThemeIcon>
      </Tooltip>

      {/* Futuristic toggle switch */}
      <Tooltip label="Future toggle" position="bottom" withArrow>
        <MockFuturisticToggle
          active={activeCategory === 'future'}
          onClick={() => handleCategoryClick('future')}
        />
      </Tooltip>

      {/* Avatar as a button */}
      <Tooltip label="Profile category" position="bottom" withArrow>
        <Avatar
          size="xs"
          color="cyan"
          radius="xl"
          style={{ cursor: 'pointer' }}
          onClick={() => handleCategoryClick('profile')}
        >
          P
        </Avatar>
      </Tooltip>

      {/* Indicator dot */}
      <Tooltip label="Notification category" position="bottom" withArrow>
        <Indicator size={8} color="red" withBorder processing>
          <div 
            style={{ width: '10px', height: '10px', cursor: 'pointer' }}
            onClick={() => handleCategoryClick('notification')}
          />
        </Indicator>
      </Tooltip>

      {/* Text-only pseudo button */}
      <Tooltip label="Underline category" position="bottom" withArrow>
        <span 
          style={{ 
            fontSize: '9px', 
            textDecoration: 'underline', 
            color: '#1c7ed6',
            cursor: 'pointer' 
          }}
          onClick={() => handleCategoryClick('text')}
        >
          txt
        </span>
      </Tooltip>

      {/* Just three dots */}
      <Tooltip label="More options" position="bottom" withArrow>
        <div 
          style={{ 
            fontSize: '12px', 
            color: '#868e96', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => handleCategoryClick('more')}
        >
          …
        </div>
      </Tooltip>

      {/* Keyboard key button */}
      <Tooltip label="Keyboard category" position="bottom" withArrow>
        <KeyCapButton
          letter="K"
          onClick={() => handleCategoryClick('keyboard')}
          isActive={activeCategory === 'keyboard'}
        />
      </Tooltip>
      
      {/* Tiny terminal button with cursor */}
      <Tooltip label="Terminal category" position="bottom" withArrow>
        <MockTerminalButton
          onClick={() => handleCategoryClick('terminal')}
          isActive={activeCategory === 'terminal'}
        />
      </Tooltip>
      
      {/* Mac command key */}
      <Tooltip label="Command category" position="bottom" withArrow>
        <MockCommandButton
          onClick={() => handleCategoryClick('command')}
        />
      </Tooltip>
      
      {/* Progress ring button */}
      <Tooltip label="Progress category" position="bottom" withArrow>
        <ProgressButton
          value={75}
          onClick={() => handleCategoryClick('progress')}
          isActive={activeCategory === 'progress'}
        />
      </Tooltip>
      
      {/* LCD Segment Display */}
      <Tooltip label="Digital category" position="bottom" withArrow>
        <LCDSegmentButton
          digit="8"
          onClick={() => handleCategoryClick('digital')}
          isActive={activeCategory === 'digital'}
        />
      </Tooltip>
      
      {/* Glitched text button */}
      <Tooltip label="Glitch category" position="bottom" withArrow>
        <MockGlitchButton 
          onClick={() => handleCategoryClick('glitch')}
          text="err"
        />
      </Tooltip>
      
      {/* Line progress bar as button */}
      <Tooltip label="Loading category" position="bottom" withArrow>
        <div style={{ width: '40px', cursor: 'pointer' }} onClick={() => handleCategoryClick('loading')}>
          <Progress 
            value={activeCategory === 'loading' ? 100 : 45} 
            color={activeCategory === 'loading' ? 'green' : 'gray'} 
            size="xs"
            striped={activeCategory === 'loading'}
            animated={activeCategory === 'loading'}
          />
        </div>
      </Tooltip>
      
      {/* Brain icon button */}
      <Tooltip label="AI category" position="bottom" withArrow>
        <ActionIcon 
          color="indigo" 
          variant="subtle" 
          radius="xl" 
          size="xs" 
          onClick={() => handleCategoryClick('ai')}
        >
          <IconBrain size="0.8rem" />
        </ActionIcon>
      </Tooltip>
      
      {/* Flame icon button */}
      <Tooltip label="Trending category" position="bottom" withArrow>
        <div 
          className="flame-button"
          onClick={() => handleCategoryClick('trending')}
        >
          <IconFlame size="0.8rem" className={activeCategory === 'trending' ? 'flame-active' : ''} />
        </div>
      </Tooltip>
    </div>
  );
};

export default ButtonModule;