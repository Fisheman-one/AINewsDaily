import { RedditPost } from '../types/news';
import { HNStory } from '../types/news';
import { ScoredNews } from '../types/news';
import { CONFIG } from './config';

export function calculateScores(
  redditPosts: RedditPost[],
  hnStories: HNStory[]
): ScoredNews[] {
  const newsMap = new Map<string, ScoredNews>();
  const { weights, maxResults } = CONFIG.scoring;

  // Process Reddit posts
  for (const post of redditPosts) {
    const normalizedScore = normalizeRedditScore(post);
    const key = normalizeUrl(post.url);

    if (newsMap.has(key)) {
      const existing = newsMap.get(key)!;
      existing.redditScore = normalizedScore;
      if (!existing.source.some(s => s.startsWith('Reddit'))) {
        existing.source.push(`Reddit r/${post.subreddit}`);
      }
    } else {
      newsMap.set(key, {
        id: `reddit-${post.id}`,
        title: post.title,
        url: post.url,
        source: [`Reddit r/${post.subreddit}`],
        hotness: 0,
        redditScore: normalizedScore,
        publishedAt: post.createdUtc,
      });
    }
  }

  // Process HN stories
  for (const story of hnStories) {
    const normalizedScore = normalizeHNScore(story);
    const key = normalizeUrl(story.url);

    if (newsMap.has(key)) {
      const existing = newsMap.get(key)!;
      existing.hnScore = normalizedScore;
      if (!existing.source.some(s => s.startsWith('HN'))) {
        existing.source.push('Hacker News');
      }
    } else {
      newsMap.set(key, {
        id: `hn-${story.id}`,
        title: story.title,
        url: story.url,
        source: ['Hacker News'],
        hotness: 0,
        hnScore: normalizedScore,
        publishedAt: story.time,
      });
    }
  }

  // Calculate combined hotness scores
  const results = Array.from(newsMap.values()).map(news => {
    const rScore = news.redditScore || 0;
    const hScore = news.hnScore || 0;
    const tScore = news.twitterScore || 0;

    news.hotness = Math.round(
      (rScore * weights.reddit + hScore * weights.hn + tScore * weights.twitter) * 100
    ) / 100;

    return news;
  });

  // Sort by hotness descending
  results.sort((a, b) => b.hotness - a.hotness);

  return results.slice(0, maxResults);
}

function normalizeRedditScore(post: RedditPost): number {
  // Use log scale to normalize scores across different magnitudes
  // Weight comments and awards more than simple upvotes
  const score = Math.log(post.score + post.numComments * 2 + 1);
  return score / 15;
}

function normalizeHNScore(story: HNStory): number {
  // Calculate age in hours
  const ageInHours = (Date.now() / 1000 - story.time) / 3600;
  // Time decay factor - newer stories get higher scores
  const timeDecay = Math.exp(-ageInHours / 24);
  // Base score with comment multiplier
  const baseScore = (story.score * 2 + story.descendants * 3) / 100;
  return baseScore * timeDecay;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove www and trailing slashes for better deduplication
    let normalized = u.hostname.replace(/^www\./, '') + u.pathname;
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  } catch {
    return url;
  }
}
