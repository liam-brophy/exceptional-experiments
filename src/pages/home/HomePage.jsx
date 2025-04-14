import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { experiments } from '../../experiments/experimentList';
import {
  Container, Title, Text, TextInput, SimpleGrid, Paper,
  Group, Chip, Badge, AspectRatio, Image, Box, Stack,
  useMantineTheme, rem, Select, Button,
} from '@mantine/core';
import { IconSearch, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import ExperimentCard from '../../shared/components/ExperimentCard';
import ThemeToggle from '../../shared/components/ThemeToggle/ThemeToggle';
import { useTheme } from '../../shared/context/ThemeContext';
import './HomePage.css';

const NewsTicker = ({ messages }) => {
  const [shuffledMessages, setShuffledMessages] = useState([]);
  
  useEffect(() => {
    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };
    
    setShuffledMessages(shuffleArray(messages));
  }, [messages]);
  
  // Join the shuffled messages, not the original ones
  const tickerText = shuffledMessages.join(' • ');
  
  return (
    <div className="news-ticker-container">
      <div className="news-ticker-track">
        {tickerText} • {tickerText} • {tickerText}
      </div>
    </div>
  );
};

const HomePage = () => {
  const mantineTheme = useMantineTheme();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hoveredExperimentId, setHoveredExperimentId] = useState(null);
  const [sortOption, setSortOption] = useState('newest');

  const tickerMessages = [
    "Scientists confirm clouds are just sky thoughts passing through.",
    "Federal report reveals time is slower near microwaves, for reasons no one will discuss.",
    "A lonely fax machine has begun sending unsolicited poetry to Wall Street.",
    "Study finds pigeons have been running a parallel government since 1974.",
    "Philosophers admit they’ve been making up words like ‘epistemogunk’ for decades.",
    "NASA quietly apologizes for accidentally launching Earth’s spare moon.",
    "All staplers to be recalled after admitting to mild existential dread.",
    "New psychological condition identified: refrigerator light syndrome.",
    "Economists baffled as national debt pays itself off with ancient coupons.",
    "Survey finds 72% of mirrors unsure what they're reflecting anymore.",
    "Biologists warn that mushrooms may be dreaming of us, not the other way around.",
    "Breaking: Calendar refuses to acknowledge Monday, cites creative differences.",
    "Official dictionary expands definition of ‘reality’ to include minor hallucinations.",
    "Public transit agency launches new service for ghosts who died waiting for the 5:15.",
    "Anthropologists discover society still held together by Post-It notes and mild guilt.",
    "Mathematician invents new number between 7 and 8; chaos ensues.",
    "Weather system develops crush on specific mountaintop, lingers awkwardly.",
    "The internet briefly became sentient, googled itself, and hasn’t spoken since.",
    "New planet discovered orbiting very bad ideas at tremendous speed.",
    "Wormhole opens in local laundromat, offers better rates than current housing market.",
    "Retired satellite sends final message: 'It was never about the data.'",
    "Bread loaf claims divine origins, begins healing the gluten intolerant.",
    "Time traveler returns with no memory and a half-written screenplay.",
    "Traffic cone elected mayor of abandoned parking lot, vows transparency.",
    "The moon has requested privacy after recent rumors about its dark side.",
    "Breaking: All clocks now ticking in Morse code for 'HELP'.",
    "Psychic hotline employee quits after accurately predicting own burnout.",
    "New law requires all shadows to register as emotional support silhouettes.",
    "Cloud formation spotted reenacting key scenes from failed relationships.",
    "Mathematical constant pi reveals it's been rounding itself off out of modesty.",
    "Retired chess grandmaster begins consulting for unpredictable weather patterns.",
    "National anthem now includes kazoo solo, to reflect collective mood.",
    "Conspiracy theorists proven right about something, immediately lose interest.",
    "Lost thought recovered in subway station, handed over to authorities.",
    "New psychological study links déjà vu to cosmic buffering.",
    "Planetarium to host first interstellar open mic night—aliens encouraged.",
    "Dust particles unionize, demand better lighting and occasional acknowledgment.",
    "Antique globe spins on its own, muttering names of forgotten countries.",
    "Printer confesses it's been using Comic Sans out of quiet rebellion.",
    "Global summit convened to address growing number of unexplainable vibes."
  ];
  
  const allTags = [...new Set(experiments.flatMap(exp => exp.tags || []))].sort();

  const filteredExperiments = experiments.filter(exp => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = exp.title.toLowerCase().includes(lowerSearch) ||
                         exp.description.toLowerCase().includes(lowerSearch);
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.every(tag => (exp.tags || []).includes(tag));
    
    return matchesSearch && matchesTags;
  });

  // Sort experiments based on sort option
  const sortedExperiments = [...filteredExperiments].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return 0; // Keep original order
    }
  });

  const handleMouseEnter = (id) => setHoveredExperimentId(id);
  const handleMouseLeave = () => setHoveredExperimentId(null);

  // Styles for the INNER Paper (Frosted Glass)
  const frostedGlassStyleInner = (theme) => ({
    backgroundColor: theme.colorScheme === 'dark'
      ? 'rgba(40, 40, 55, 0.65)' // Adjust opacity as needed
      : 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(8px)', // Adjust blur
    borderRadius: theme.radius.sm, // Inner radius
    overflow: 'hidden', // CRITICAL for frosted glass clipping
    height: '100%',
    width: '100%',
    position: 'relative', // Stacking context for content
  });

  // Define border thickness/padding
  const borderPadding = rem(5); // Reset padding to original value or adjust

  return (
    <>
      {/* News Ticker */}
      <NewsTicker messages={tickerMessages} />
      
      <Container size="lg" py="xl">
        {/* Header */}
        <Stack align="center" mb="xl">
          <Title order={1} align="center"></Title>
          <Text className="laboratory-title" align="center">
               Laboratory
          </Text>
          <Text color="dimmed" size="sm" align="center" italic>
            updated (almost) everyday
          </Text>
          
          {/* Theme Toggle placed in the header for universal access */}
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </Stack>

        {/* Filters */}
        <Stack mb="xl" gap="lg">
          <Group position="apart" align="flex-end">
            <Group>
              <Button
                variant={sortOption === 'newest' ? "filled" : "outline"}
                onClick={() => setSortOption('newest')}
                radius="md"
                leftIcon={<IconArrowUp size={16} />}
                className="sort-button"
                size="sm"
                color="dark"
              >
                New
              </Button>
              <Button
                variant={sortOption === 'oldest' ? "filled" : "outline"}
                onClick={() => setSortOption('oldest')}
                radius="md"
                leftIcon={<IconArrowDown size={16} />}
                className="sort-button"
                size="sm"
                color="dark"
              >
                Old
              </Button>
            </Group>
            
            <TextInput 
              placeholder="Search experiments..." 
              value={searchTerm} 
              onChange={(event) => setSearchTerm(event.currentTarget.value)} 
              leftSection={<IconSearch size={18} stroke={1.5} />} 
              size="md" 
              radius="xl"
              style={{ flexGrow: 1 }}
            />
          </Group>
           
          {/* Experimental Tag System - directly below search bar */}
          <div className="experimental-tag-container">
             {allTags.map((tag, index) => {
               const isSelected = selectedTags.includes(tag);
               // Use the specified color palette
               const colors = ['#0300F0', '#00F0D4', '#FF0D66', '#FCFF00', '#000000'];
               const tagColorIndex = index % colors.length;
               const tagColor = colors[tagColorIndex];
               
               return (
                 <Box 
                   key={tag} 
                   className={`experimental-tag ${isSelected ? 'selected' : ''}`}
                   onClick={() => {
                     if (isSelected) {
                       setSelectedTags(selectedTags.filter(t => t !== tag));
                     } else {
                       setSelectedTags([...selectedTags, tag]);
                     }
                   }}
                 >
                   <div 
                     className="tag-glow" 
                     style={{ 
                       backgroundColor: `${tagColor}33`, // 20% opacity version of the color
                       boxShadow: isSelected ? `0 0 15px ${tagColor}BB` : 'none' // 73% opacity version for the glow
                     }} 
                   />
                   <div 
                     className={`tag-content ${isSelected ? 'tag-animation' : ''}`}
                     style={{ 
                       backgroundColor: isSelected ? tagColor : `${tagColor}11`, // Full color when selected, 7% opacity when not
                       color: isSelected ? (tagColor === '#FCFF00' || tagColor === '#00F0D4' ? '#000000' : '#FFFFFF') : tagColor,
                       border: `1px solid ${tagColor}88`, // 53% opacity for the border
                     }}
                   >
                     {tag}
                   </div>
                 </Box>
               );
             })}
           </div>
        </Stack>

        {/* Grid */}
        <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="xl"
            verticalSpacing="xl"
          >
          {sortedExperiments.map(experiment => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              isHovered={hoveredExperimentId === experiment.id}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </SimpleGrid>
      </Container>
    </>
  );
};

export default HomePage;