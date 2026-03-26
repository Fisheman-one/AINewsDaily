import axios from 'axios';
import { HNStory } from '../types/news';

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

// 36kr RSS feed
export async function fetch36krNews(): Promise<ChineseNews[]> {
  try {
    const response = await axios.get(
      'https://36kr.com/feed',
      {
        headers: {
          'User-Agent': 'AINewsDaily/1.0',
        },
        timeout: 10000,
      }
    );

    // Parse RSS XML
    const items = parseRSSItems(response.data);
    return items.slice(0, 20).map((item: any) => ({
      id: `36kr-${item.guid || item.link}`,
      title: item.title,
      titleZh: item.title, // Already Chinese
      url: item.link,
      source: '36氪',
      score: 0,
      publishedAt: Math.floor(new Date(item.pubDate).getTime() / 1000),
      summaryZh: item.description?.replace(/<[^>]+>/g, '').substring(0, 200),
    }));
  } catch (error) {
    console.error('Failed to fetch 36kr:', (error as Error).message);
    return [];
  }
}

// IT之家 RSS
export async function fetchITHomenNews(): Promise<ChineseNews[]> {
  try {
    const response = await axios.get(
      'https://www.ithome.com.tw/rss',
      {
        headers: {
          'User-Agent': 'AINewsDaily/1.0',
        },
        timeout: 10000,
      }
    );

    const items = parseRSSItems(response.data);
    return items.slice(0, 20).map((item: any) => ({
      id: `ithome-${item.guid || item.link}`,
      title: item.title,
      titleZh: item.title,
      url: item.link,
      source: 'IT之家',
      score: 0,
      publishedAt: Math.floor(new Date(item.pubDate).getTime() / 1000),
      summaryZh: item.description?.replace(/<[^>]+>/g, '').substring(0, 200),
    }));
  } catch (error) {
    console.error('Failed to fetch IT之家:', (error as Error).message);
    return [];
  }
}

// 少数派 RSS
export async function fetchSspaiNews(): Promise<ChineseNews[]> {
  try {
    const response = await axios.get(
      'https://sspai.com/feed',
      {
        headers: {
          'User-Agent': 'AINewsDaily/1.0',
        },
        timeout: 10000,
      }
    );

    const items = parseRSSItems(response.data);
    return items.slice(0, 15).map((item: any) => ({
      id: `sspai-${item.guid || item.link}`,
      title: item.title,
      titleZh: item.title,
      url: item.link,
      source: '少数派',
      score: 0,
      publishedAt: Math.floor(new Date(item.pubDate).getTime() / 1000),
      summaryZh: item.description?.replace(/<[^>]+>/g, '').substring(0, 200),
    }));
  } catch (error) {
    console.error('Failed to fetch 少数派:', (error as Error).message);
    return [];
  }
}

// 虎嗅 RSS
export async function fetchHuxiuNews(): Promise<ChineseNews[]> {
  try {
    const response = await axios.get(
      'https://www.huxiu.com/rss/',
      {
        headers: {
          'User-Agent': 'AINewsDaily/1.0',
        },
        timeout: 10000,
      }
    );

    const items = parseRSSItems(response.data);
    return items.slice(0, 20).map((item: any) => ({
      id: `huxiu-${item.guid || item.link}`,
      title: item.title,
      titleZh: item.title,
      url: item.link,
      source: '虎嗅',
      score: 0,
      publishedAt: Math.floor(new Date(item.pubDate).getTime() / 1000),
      summaryZh: item.description?.replace(/<[^>]+>/g, '').substring(0, 200),
    }));
  } catch (error) {
    console.error('Failed to fetch 虎嗅:', (error as Error).message);
    return [];
  }
}

// Simple RSS parser for XML
function parseRSSItems(xml: string): any[] {
  const items: any[] = [];
  const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const item: any = {};

    const getContent = (tag: string) => {
      const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    item.title = getContent('title');
    item.link = getContent('link');
    item.description = getContent('description') || getContent('content:encoded');
    item.pubDate = getContent('pubDate') || getContent('dc:date');
    item.guid = getContent('guid');

    if (item.title && item.link) {
      items.push(item);
    }
  }

  return items;
}
