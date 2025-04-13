import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { experiments } from '../../experiments/experimentList';
import {
  Container, Title, Text, TextInput, SimpleGrid, Paper,
  Group, Chip, Badge, AspectRatio, Image, Box, Stack,
  useMantineTheme, rem,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import ExperimentCard from '../../shared/components/ExperimentCard';
import './HomePage.css';

const NewsTicker = ({ messages }) => {
  const tickerText = messages.join(' • ');
  
  return (
    <div className="news-ticker-container">
      <div className="news-ticker-track">
        {tickerText} • {tickerText} • {tickerText}
      </div>
    </div>
  );
};

const HomePage = () => {
  const theme = useMantineTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hoveredExperimentId, setHoveredExperimentId] = useState(null);

  // News ticker messages
  const tickerMessages = [
    "🚀 New experiment coming next week! Stay tuned for updates...",
    "✨ Try the Magic Crayon experiment for a relaxing creative session",
    "📣 Now supporting keyboard interactions in all experiments",
    "🔥 Interactive Keyboard demo reached 500 interactions this month",
    "💡 Suggestion? Submit experiment ideas through the contact form"
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
          <Text size="xl" color="dimmed" align="center">
              you are years behind my research
          </Text>
        </Stack>

        {/* Filters */}
        <Stack mb="xl" gap="lg">
           <TextInput placeholder="Search experiments..." value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} leftSection={<IconSearch size={18} stroke={1.5} />} size="md" radius="xl"/>
           <Chip.Group multiple value={selectedTags} onChange={setSelectedTags}><Group justify="center" gap="xs">{allTags.map(tag => (<Chip key={tag} value={tag} variant="outline" size="sm" radius="sm">{tag}</Chip>))}</Group></Chip.Group>
        </Stack>

        {/* Grid */}
        <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="xl"
            verticalSpacing="xl"
          >
          {filteredExperiments.map(experiment => (
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