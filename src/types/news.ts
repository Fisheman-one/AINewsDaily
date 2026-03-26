export interface RedditPost {
  id: string;
  title: string;
  titleZh?: string;
  url: string;
  score: number;
  numComments: number;
  createdUtc: number;
  subreddit: string;
  permalink: string;
  summaryZh?: string;
}

export interface HNStory {
  id: number;
  title: string;
  titleZh?: string;
  url: string;
  score: number;
  descendants: number;
  time: number;
  summaryZh?: string;
}

export interface ChineseNews {
  id: string;
  title: string;
  titleZh?: string;
  url: string;
  source: string;
  score: number;
  publishedAt: number;
  summary?: string;
  summaryZh?: string;
}

export interface ScoredNews {
  id: string;
  title: string;
  titleZh?: string;
  url: string;
  source: string[];
  hotness: number;
  redditScore?: number;
  hnScore?: number;
  cnScore?: number;
  publishedAt: number;
  summary?: string;
  summaryZh?: string;
  isTranslated?: boolean;
}

export interface NewsData {
  generatedAt: string;
  totalCount: number;
  news: ScoredNews[];
}
