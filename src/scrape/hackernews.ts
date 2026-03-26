import axios from 'axios';
import { CONFIG } from './config';
import { HNStory } from '../types/news';

export async function fetchHNNews(): Promise<HNStory[]> {
  const { baseUrl, aiKeywords, topStoriesLimit, fetchConcurrency } = CONFIG.hackerNews;

  // Get top stories
  const topStoriesResponse = await axios.get(`${baseUrl}/topstories.json`);
  const storyIds = topStoriesResponse.data.slice(0, topStoriesLimit);

  console.log(`Fetching ${storyIds.length} HN stories...`);

  // Fetch in chunks to avoid overwhelming the API
  const stories: HNStory[] = [];
  const chunks = chunkArray(storyIds, fetchConcurrency);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const details = await Promise.all(
      chunk.map(id => axios.get(`${baseUrl}/item/${id}.json`).catch(() => null))
    );

    for (const resp of details) {
      if (!resp || !resp.data) continue;
      const story = resp.data;
      if (!story.url || story.type !== 'story') continue;

      // Check if AI related
      const titleLower = story.title.toLowerCase();
      const isAIRelated = aiKeywords.some(kw =>
        titleLower.includes(kw.toLowerCase())
      );

      // Include if AI-related or high score
      if (isAIRelated || (story.score && story.score > 100)) {
        stories.push({
          id: story.id,
          title: story.title,
          url: story.url,
          score: story.score || 0,
          descendants: story.descendants || 0,
          time: story.time,
        });
      }
    }

    if ((i + 1) % 5 === 0) {
      console.log(`Processed ${(i + 1) * fetchConcurrency} stories...`);
    }
  }

  console.log(`Found ${stories.length} AI-related HN stories`);
  return stories;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}
