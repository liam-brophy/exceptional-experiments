import React from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Stack, AspectRatio, Image, Box, Title, Text, Group, Badge,
} from '@mantine/core';
import './ExperimentCard.css';

const ExperimentCard = ({ experiment, isHovered, onMouseEnter, onMouseLeave }) => {
  const { id, slug, title, description, tags, thumbnail, Component } = experiment;

  return (
    <Box
      className={`experiment-card-wrapper experiment-${id}`}
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={onMouseLeave}
    >
      <Link to={`/experiment/${slug}`} className="experiment-card">
        <Paper withBorder={false} radius="sm" p="0" className="card-content-wrapper">
          <Stack gap={0} style={{ height: '100%' }}>
            <AspectRatio ratio={16 / 10} style={{ flexShrink: 0 }}>
              {isHovered && Component ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      width: '1000px',
                      height: '600px',
                      transformOrigin: 'top left',
                      transform: 'scale(0.3)',
                      pointerEvents: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <Box sx={{ width: '100%', height: '100%' }}>
                      <Component />
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Image
                  src={thumbnail}
                  alt={title}
                  fallbackSrc=""
                />
              )}
            </AspectRatio>
            <Box p="md" style={{ flexGrow: 1 }}>
              <Title order={4} size="h5" mb="xs" lineClamp={1}>
                {title}
              </Title>
              <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                {description}
              </Text>
              <Group gap="xs" wrap="wrap">
                {(tags || []).slice(0, 4).map(tag => (
                  <Badge key={tag} size="sm" radius="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Box>
          </Stack>
        </Paper>
      </Link>
    </Box>
  );
};

export default ExperimentCard;