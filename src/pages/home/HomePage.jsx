import { useState } from 'react';
import { Link } from 'react-router-dom';
import { experiments } from '../../experiments/experimentList';
import {
  Container, Title, Text, TextInput, SimpleGrid, Paper,
  Group, Chip, Badge, AspectRatio, Image, Box, Stack,
  useMantineTheme,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const HomePage = () => {
  const theme = useMantineTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hoveredExperimentId, setHoveredExperimentId] = useState(null);

  const allTags = [...new Set(experiments.flatMap(exp => exp.tags))].sort();

  const filteredExperiments = experiments.filter(exp => {
    // ... filtering logic remains the same ...
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = exp.title.toLowerCase().includes(lowerSearch) ||
                         exp.description.toLowerCase().includes(lowerSearch);
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.every(tag => exp.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleMouseEnter = (id) => setHoveredExperimentId(id);
  const handleMouseLeave = () => setHoveredExperimentId(null);

  // --- Define Frosted Glass Styles for the INNER Paper ---
  // Note: Removed hover transform/shadow here, will apply directly to Paper
  const frostedGlassStyleInner = (theme) => ({
    backgroundColor: theme.colorScheme === 'dark'
      ? 'rgba(40, 40, 55, 0.55)' // Slightly adjust alpha if needed
      : 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(10px)', // Adjust blur amount
    // Border might not be needed if outer filter provides edge
    // border: `1px solid ${theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)'}`,
    borderRadius: theme.radius.sm, // Slightly smaller radius for inner element
    overflow: 'hidden', // CRITICAL for frosted glass clipping
    height: '100%',     // Ensure it fills the padded Link area
    width: '100%',
  });
  // --- ---

  return (
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
        <TextInput /* ... search input ... */
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            leftSection={<IconSearch size={18} stroke={1.5} />}
            size="md"
            radius="xl"
        />
        <Chip.Group multiple value={selectedTags} onChange={setSelectedTags}>
           <Group justify="center" gap="xs">
            {allTags.map(tag => (
              <Chip key={tag} value={tag} variant="outline" size="sm" radius="sm">
                {tag}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      {/* Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
        {filteredExperiments.map(experiment => {
          const { Component } = experiment;
          const isHovered = hoveredExperimentId === experiment.id;

          return (
            // Outer Link: Handles Filter, Padding, Navigation, Hover Detection
            <Link
              to={`/experiment/${experiment.slug}`}
              key={experiment.id}
              style={{
                display: 'block', // Important for padding/layout
                position: 'relative',
                textDecoration: 'none',
                padding: '5px', // Creates the border thickness space
                borderRadius: theme.radius.md, // Outer radius
                // Apply dynamic filter
                filter: experiment.filterId ? `url(#${experiment.filterId})` : 'none',
                // Allow filter effects (shadows, distortion) to be visible
                overflow: experiment.filterId ? 'visible' : 'hidden',
                // Background for the Link (will be mostly covered by Paper)
                // Optional: could be a fallback or slightly different shade
                 backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[1],
              }}
              onMouseEnter={() => handleMouseEnter(experiment.id)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Inner Paper: Handles Frosted Glass, Content Clipping, Hover Effects */}
              <Paper
                withBorder={false} // Border handled by style if needed
                radius="sm" // Inner radius (slightly smaller than link padding)
                p="0" // No padding ON the paper itself
                sx={(theme) => ({
                  ...frostedGlassStyleInner(theme), // Apply frosted styles
                  // Apply hover transform/shadow to the Paper
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                     // Lift the Paper slightly on hover
                     transform: 'translateY(-3px) scale(1.01)', // Combine lift with slight scale
                     boxShadow: theme.shadows.md, // Use a slightly less intense shadow maybe
                  },
                })}
              >
                {/* Content Stack */}
                <Stack gap={0}>
                  <AspectRatio ratio={16 / 10}>
                    {isHovered && Component ? (
                      // Preview Container
                      <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                        <Box
                           sx={{
                              width: '1000px', height: '600px', // Adjust base size
                              transformOrigin: 'top left',
                              transform: 'scale(0.30)', // Adjust scale
                              pointerEvents: 'none',
                              position: 'absolute', top: 0, left: 0,
                           }}
                        >
                           <Box sx={{width: '100%', height: '100%'}}>
                                <Component />
                           </Box>
                        </Box>
                      </Box>
                    ) : (
                      // Thumbnail Image
                      <Image
                        src={experiment.thumbnail}
                        alt={experiment.title}
                        fallbackSrc="https://via.placeholder.com/300x180?text=No+Image"
                      />
                    )}
                  </AspectRatio>

                  {/* Text Content Area */}
                  <Box p="md">
                    <Title order={3} size="h4" mb="xs" lineClamp={1} c={theme.colorScheme === 'dark' ? 'gray.1' : 'gray.9'}>
                       {experiment.title}
                    </Title>
                    <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                      {experiment.description}
                    </Text>
                    <Group gap="xs" wrap="wrap">
                      {experiment.tags.map(tag => (
                        <Badge key={tag} variant={theme.colorScheme === 'dark' ? 'filled': 'light'} color={theme.colorScheme === 'dark' ? 'dark.3' : 'gray.3'} size="sm" radius="sm">
                           {tag}
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                </Stack>
              </Paper> {/* End Inner Paper */}
            </Link> 
          );
        })}
      </SimpleGrid>
    </Container>
  );
};

export default HomePage;