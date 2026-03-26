import * as fs from 'fs';
import * as path from 'path';
import { fetchRedditNews } from './reddit';
import { fetchHNNews } from './hackernews';
import { fetch36krNews, fetchITHomenNews, fetchHuxiuNews, fetchSspaiNews } from './chinese';
import { calculateScores } from './scorer';
import { NewsData } from '../types/news';
import { CONFIG } from './config';

async function main() {
  console.log('Starting AI News scrape at', new Date().toISOString());
  console.log('---');

  try {
    // Fetch from all sources in parallel
    const [redditNews, hnNews, kr36, ithome, huxiu, sspai] = await Promise.all([
      fetchRedditNews().catch(() => []),
      fetchHNNews().catch(() => []),
      fetch36krNews().catch(() => []),
      fetchITHomenNews().catch(() => []),
      fetchHuxiuNews().catch(() => []),
      fetchSspaiNews().catch(() => []),
    ]);

    // Combine Chinese news sources
    const chineseNews = [...kr36, ...ithome, ...huxiu, ...sspai];

    console.log(`Fetched: ${redditNews.length} Reddit, ${hnNews.length} HN, ${chineseNews.length} Chinese news`);

    // Calculate hotness scores and merge
    const scoredNews = calculateScores(redditNews, hnNews, chineseNews);

    // Prepare output
    const output: NewsData = {
      generatedAt: new Date().toISOString(),
      totalCount: scoredNews.length,
      news: scoredNews,
    };

    // Ensure output directory exists
    const outputDir = path.dirname(CONFIG.output.path);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output
    const outputPath = path.resolve(CONFIG.output.path);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`---`);
    console.log(`Written ${scoredNews.length} news items to ${outputPath}`);
    console.log('Scrape completed successfully!');
  } catch (error) {
    console.error('Scrape failed:', error);
    process.exit(1);
  }
}

main();
