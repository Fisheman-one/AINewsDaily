import { RedditPost } from '../types/news';
import { HNStory } from '../types/news';
import { ChineseNews } from '../types/news';
import { ScoredNews } from '../types/news';
import { CONFIG } from './config';

export function calculateScores(
  redditPosts: RedditPost[],
  hnStories: HNStory[],
  chineseNews: ChineseNews[]
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
        titleZh: post.titleZh || post.title,
        url: post.url,
        source: [`Reddit r/${post.subreddit}`],
        hotness: 0,
        redditScore: normalizedScore,
        publishedAt: post.createdUtc,
        summaryZh: post.summaryZh,
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
      existing.titleZh = existing.titleZh || story.titleZh;
      if (!existing.source.some(s => s.startsWith('HN'))) {
        existing.source.push('Hacker News');
      }
    } else {
      newsMap.set(key, {
        id: `hn-${story.id}`,
        title: story.title,
        titleZh: story.titleZh || story.title,
        url: story.url,
        source: ['Hacker News'],
        hotness: 0,
        hnScore: normalizedScore,
        publishedAt: story.time,
        summaryZh: story.summaryZh,
      });
    }
  }

  // Process Chinese news
  for (const cn of chineseNews) {
    const normalizedScore = normalizeChineseScore(cn);
    const key = normalizeUrl(cn.url);

    if (newsMap.has(key)) {
      const existing = newsMap.get(key)!;
      existing.cnScore = normalizedScore;
      if (!existing.source.includes(cn.source)) {
        existing.source.push(cn.source);
      }
    } else {
      newsMap.set(key, {
        id: cn.id,
        title: cn.title,
        titleZh: cn.titleZh || cn.title,
        url: cn.url,
        source: [cn.source],
        hotness: 0,
        cnScore: normalizedScore,
        publishedAt: cn.publishedAt,
        summaryZh: cn.summaryZh,
      });
    }
  }

  // Calculate combined hotness scores
  const results = Array.from(newsMap.values()).map(news => {
    const rScore = news.redditScore || 0;
    const hScore = news.hnScore || 0;
    const cScore = news.cnScore || 0;

    news.hotness = Math.round(
      (rScore * weights.reddit + hScore * weights.hn + cScore * 0.25) * 100
    ) / 100;

    // Mark if this has Chinese content
    news.isTranslated = news.titleZh !== news.title;

    return news;
  });

  // Sort by hotness descending
  results.sort((a, b) => b.hotness - a.hotness);

  return results.slice(0, maxResults);
}

function normalizeRedditScore(post: RedditPost): number {
  const score = Math.log(post.score + post.numComments * 2 + 1);
  return score / 15;
}

function normalizeHNScore(story: HNStory): number {
  const ageInHours = (Date.now() / 1000 - story.time) / 3600;
  const timeDecay = Math.exp(-ageInHours / 24);
  const baseScore = (story.score * 2 + story.descendants * 3) / 100;
  return baseScore * timeDecay;
}

function normalizeChineseScore(cn: ChineseNews): number {
  // For Chinese sources, use a simpler scoring based on recency
  const ageInHours = (Date.now() / 1000 - cn.publishedAt) / 3600;
  const timeDecay = Math.exp(-ageInHours / 24);
  // Base score of 5 for Chinese sources
  return 5 * timeDecay;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    let normalized = u.hostname.replace(/^www\./, '') + u.pathname;
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  } catch {
    return url;
  }
}
