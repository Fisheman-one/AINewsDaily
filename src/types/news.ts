export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  numComments: number;
  createdUtc: number;
  subreddit: string;
  permalink: string;
}

export interface HNStory {
  id: number;
  title: string;
  url: string;
  score: number;
  descendants: number;
  time: number;
}

export interface ScoredNews {
  id: string;
  title: string;
  url: string;
  source: string[];
  hotness: number;
  redditScore?: number;
  hnScore?: number;
  twitterScore?: number;
  publishedAt: number;
  summary?: string;
}

export interface NewsData {
  generatedAt: string;
  totalCount: number;
  news: ScoredNews[];
}
