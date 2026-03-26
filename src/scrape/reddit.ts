import axios from 'axios';
import { CONFIG } from './config';
import { RedditPost } from '../types/news';

export async function fetchRedditNews(): Promise<RedditPost[]> {
  const results: RedditPost[] = [];

  for (const sub of CONFIG.reddit.subreddits) {
    try {
      const response = await axios.get(
        `https://www.reddit.com/r/${sub}/hot.json`,
        {
          headers: { 'User-Agent': CONFIG.reddit.userAgent },
          params: { limit: CONFIG.reddit.limit },
        }
      );

      const posts = response.data.data.children;
      for (const post of posts) {
        const data = post.data;
        // Filter out self posts without URLs
        if (!data.url || data.url.includes('reddit.com/r/' + sub + '/comments')) {
          continue;
        }
        results.push({
          id: data.id,
          title: data.title,
          url: data.url,
          score: data.score,
          numComments: data.num_comments,
          createdUtc: data.created_utc,
          subreddit: data.subreddit,
          permalink: `https://reddit.com${data.permalink}`,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch r/${sub}:`, (error as Error).message);
    }
  }

  console.log(`Fetched ${results.length} Reddit posts`);
  return results;
}
