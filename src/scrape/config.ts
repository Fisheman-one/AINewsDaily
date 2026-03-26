export const CONFIG = {
  reddit: {
    subreddits: ['MachineLearning', 'artificial', 'singularity', 'technology'],
    userAgent: 'AINewsDaily/1.0 (News Aggregator)',
    limit: 50,
  },
  hackerNews: {
    baseUrl: 'https://hacker-news.firebaseio.com/v0',
    aiKeywords: [
      'AI', 'ML', 'GPT', 'neural', 'LLM', 'deep learning',
      'OpenAI', 'Google DeepMind', 'Anthropic', 'Claude',
      'ChatGPT', 'Gemini', 'Stable Diffusion', 'Midjourney',
      'artificial intelligence', 'machine learning'
    ],
    topStoriesLimit: 500,
    fetchConcurrency: 50,
  },
  scoring: {
    weights: { reddit: 0.3, hn: 0.3, twitter: 0.15, chinese: 0.25 },
    maxResults: 35,
  },
  output: {
    path: './public/news.json',
  },
  chinese: {
    sources: ['36kr', 'ithome', 'huxiu', 'sspai'],
    hotnessBase: 5,
  },
};
