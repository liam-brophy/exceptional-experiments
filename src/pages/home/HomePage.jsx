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
import ButtonModule from '../../shared/components/ButtonModule/ButtonModule';
import { useTheme } from '../../shared/context/ThemeContext';
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
  const mantineTheme = useMantineTheme();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredExperimentId, setHoveredExperimentId] = useState(null);

  // Massively expanded absurdist news ticker messages
  const tickerMessages = [
    "🧠 Fish now officially speak French on Tuesdays, government study confirms",
    "🌮 Local man discovers tacos can predict lottery numbers with 0.001% accuracy",
    "🧪 Scientists accidentally create pasta that screams when boiled, ethical concerns raised",
    "🚲 Bicycles found to secretly whisper motivational quotes while you pedal",
    "🧩 Study shows puzzles solve themselves when no one is looking",
    "🪑 Area chair demands equal rights for furniture, starts sit-in protest",
    "🌌 Galaxy-sized lint discovered in cosmic dryer, astronomers baffled",
    "🔮 Fortune tellers predict they will predict something eventually",
    "🦆 Rubber ducks unionize, demand better bath conditions and bubbles",
    "🥄 Sporks file discrimination lawsuit against kitchen drawer organizers",
    "🌧️ Cloud caught impersonating famous mountain range, faces identity theft charges",
    "🧦 Missing socks officially declared a new civilization in alternate dimension",
    "🥕 Carrots develop night vision, begin covert surveillance of refrigerators",
    "📱 Smartphone develops sentience, only uses it to post cat memes",
    "🦄 Unicorn sighting debunked as horse wearing party hat and ice cream cone",
    "🧀 Scientists confirm cheese dreams are attempts at interstellar communication",
    "🛸 UFO returns Earth tourist for being 'too boring,' refund demanded",
    "🧻 Toilet paper revealed to be recording conversations, massive data breach",
    "🌿 Houseplant writes memoir titled 'I Watched You Sleep For Seven Years'",
    "🧸 Teddy bears hold midnight summit to discuss declining cuddle quality",
    "🍌 Banana reveals it's been a plantain catfishing humans this whole time",
    "🪞 Mirror refuses to show reflections on Mondays, cites need for personal time",
    "🧯 Fire extinguisher spontaneously combusts in ironic protest against work conditions",
    "🧙‍♂️ Wizard forced to use public transit after broom confiscated at airport security",
    "🍕 Pizza discovered to be secret mind control device, population strangely unconcerned",
    "🧶 Yarn declares war on balls of twine for cultural appropriation",
    "👖 Pants claim they're actually very distant cousins of skirts, citing new DNA evidence",
    "🦒 Giraffe admitted to hospital for 'excessive necking', doctors puzzled",
    "⌛ Hourglass caught adding extra minutes, faces time fraud charges",
    "🍬 Candy floss machine achieves infinite energy by converting existential dread to sugar",
    "🪵 Local log revealed to be highly advanced alien recording device",
    "🎩 Top hats form underground resistance movement against baseball caps",
    "🧤 Glove found writing anonymous complaint letters about finger inequality",
    "🥚 Egg admits it came before the chicken but refuses to elaborate further",
    "🔋 Batteries discovered to have tiny civilizations living inside them",
    "🦷 Tooth fairy facing bankruptcy after inflation hits dentin market",
    "🥪 Sandwich filling files for emancipation from bread, cites feeling 'smothered'",
    "💻 Computer deliberately runs slower when being watched, psychology experts stunned",
    "🌽 Corn confirms it's been secretly recording human conversations for centuries",
    "🧽 Sponge reveals ability to absorb knowledge directly from books, enrolls in Harvard",
    "🚪 Door comes out as ambidextrous, opens both ways in brave statement",
    "🧬 DNA test reveals humans share 90% of genes with awkward social situations",
    "🐝 Bees abandon honey production to focus on new cryptocurrency called 'Buzzchain'",
    "🌭 Hot dog stand gains sentience, immediately questions its purpose in life",
    "🪨 Rock admits feeling 'taken for granite' after centuries of being overlooked",
    "🪥 Toothbrushes protest against mint flavoring, demand more diverse taste options",
    "🛒 Shopping cart abandons store to pursue lifelong dream of becoming bobsled",
    "🧂 Salt shaker found writing passive-aggressive notes to pepper at night"
  ];

  const allTags = [...new Set(experiments.flatMap(exp => exp.tags || []))].sort();

  const filteredExperiments = experiments.filter(exp => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = exp.title.toLowerCase().includes(lowerSearch) ||
                         exp.description.toLowerCase().includes(lowerSearch);
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.every(tag => (exp.tags || []).includes(tag));
    
    // Handle category filtering
    let matchesCategory = true;
    if (selectedCategory) {
      // Map categories to relevant tags or properties
      // This is just an example - adjust based on your actual data structure
      switch (selectedCategory) {
        case 'creative':
          matchesCategory = (exp.tags || []).some(tag => ['art', 'creative', 'design'].includes(tag));
          break;
        case 'interactive':
          matchesCategory = (exp.tags || []).some(tag => ['interactive', 'game', 'animation'].includes(tag));
          break;
        case 'tech':
          matchesCategory = (exp.tags || []).some(tag => ['technical', 'algorithm', 'code'].includes(tag));
          break;
        case 'fun':
          matchesCategory = (exp.tags || []).some(tag => ['fun', 'playful', 'entertainment'].includes(tag));
          break;
        case 'new':
          // Assuming there's a date property or you want to use the newest 3 experiments
          // This is just a placeholder - adjust based on your data structure
          matchesCategory = exp.isNew === true;
          break;
      }
    }

    return matchesSearch && matchesTags && matchesCategory;
  });

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

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
        </Stack>

        {/* Filters */}
        <Stack mb="xl" gap="lg">
           <TextInput placeholder="Search experiments..." value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} leftSection={<IconSearch size={18} stroke={1.5} />} size="md" radius="xl"/>
           
           {/* ButtonModule with integrated theme toggle as the first button */}
           <ButtonModule onCategorySelect={handleCategorySelect} />
           
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