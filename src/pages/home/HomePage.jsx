import { useState } from 'react';
import { Link } from 'react-router-dom';
import { experiments } from '../../experiments/experimentList';
import {
  Container, Title, Text, TextInput, SimpleGrid, Paper,
  Group, Chip, Badge, AspectRatio, Image, Box, Stack,
  useMantineTheme, rem,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const HomePage = () => {
  const theme = useMantineTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hoveredExperimentId, setHoveredExperimentId] = useState(null);

  const allTags = [...new Set(experiments.flatMap(exp => exp.tags))].sort();

  const filteredExperiments = experiments.filter(exp => {
    // ... filtering logic ...
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = exp.title.toLowerCase().includes(lowerSearch) ||
                         exp.description.toLowerCase().includes(lowerSearch);
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.every(tag => exp.tags.includes(tag));
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
          verticalSpacing="xl" // Keep vertical spacing
        >
        {filteredExperiments.map(experiment => {
          const { Component } = experiment;
          const isHovered = hoveredExperimentId === experiment.id;

          return (
            // Wrapper only for grid layout and hover detection if needed
             <Box
               key={experiment.id}
               sx={{ position: 'relative', aspectRatio: '16 / 11' /* Reset aspect ratio maybe? */ }} // Set aspect ratio for consistent size
               onMouseEnter={() => handleMouseEnter(experiment.id)}
               onMouseLeave={handleMouseLeave}
             >
               {/* Outer Link: Handles Filter, Padding, Navigation */}
               <Link
                 to={`/experiment/${experiment.slug}`}
                 style={{
                   display: 'block', width: '100%', height: '100%', // Fill the Box wrapper
                   position: 'relative', // Relative for inner Paper positioning
                   textDecoration: 'none',
                   padding: borderPadding, // Padding creates border space
                   boxSizing: 'border-box',
                   borderRadius: theme.radius.md, // Outer radius

                   // Apply dynamic filter
                   filter: experiment.filterId ? `url(#${experiment.filterId})` : 'none',

                   // Overflow visible needed for filter effects
                   overflow: experiment.filterId ? 'visible' : 'hidden',

                   // Background for the Link (filter base)
                   backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[1],
                 }}
               >
                 {/* Inner Paper: Frosted Glass, Content Clipping, Hover Effects */}
                 <Paper
                   withBorder={false}
                   radius="sm" // Inner radius matching Link padding inset
                   p="0"
                   sx={(theme) => ({
                       ...frostedGlassStyleInner(theme),
                       transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                       '&:hover': {
                          transform: 'translateY(-3px) scale(1.01)',
                          boxShadow: theme.shadows.md,
                       },
                   })}
                 >
                   {/* Content Stack */}
                   <Stack gap={0} style={{height: '100%'}}>
                       <AspectRatio ratio={16 / 10} style={{ flexShrink: 0 }}>
                         {/* Preview / Thumbnail Logic */}
                         {isHovered && Component ? (
                            <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                              <Box sx={{ width: '1000px', height: '600px', transformOrigin: 'top left', transform: 'scale(0.3)', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}>
                                  <Box sx={{width: '100%', height: '100%'}}><Component /></Box>
                              </Box>
                           </Box>
                         ) : (
                           <Image src={experiment.thumbnail} alt={experiment.title} fallbackSrc="https://via.placeholder.com/300x180?text=No+Image" />
                         )}
                       </AspectRatio>
                       {/* Text Content Area */}
                       <Box p="md" style={{ flexGrow: 1 }}> {/* Allow text area to grow */}
                          <Title order={4} size="h5" mb="xs" lineClamp={1} c={theme.colorScheme === 'dark' ? 'gray.1' : 'gray.9'}>{experiment.title}</Title>
                          <Text size="sm" c="dimmed" lineClamp={2} mb="md">{experiment.description}</Text>
                          <Group gap="xs" wrap="wrap"> {/* Allow tags to wrap */}
                            {experiment.tags.slice(0, 4).map(tag => ( // Show a few tags
                              <Badge key={tag} variant={theme.colorScheme === 'dark' ? 'filled': 'light'} color={theme.colorScheme === 'dark' ? 'dark.3' : 'gray.3'} size="sm" radius="sm">
                                {tag}
                              </Badge>
                            ))}
                          </Group>
                       </Box>
                   </Stack>
                 </Paper> {/* End Inner Paper */}
               </Link> {/* End Outer Link */}
             </Box> // End Wrapper
          );
        })}
      </SimpleGrid>
    </Container>
  );
};

export default HomePage;