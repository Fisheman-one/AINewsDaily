// Daily AI News - Frontend App

const NEWS_FILE = 'news.json';

let currentNewsData = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
});

async function loadNews() {
  const featuredGrid = document.getElementById('featuredGrid');
  const newsList = document.getElementById('newsList');
  const updateTimeEl = document.getElementById('updateTime');
  const newsCountEl = document.getElementById('newsCount');

  try {
    featuredGrid.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    newsList.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>正在加载...</p></div>';

    const response = await fetch(NEWS_FILE + '?t=' + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    currentNewsData = data.news;

    updateTimeEl.textContent = formatDateTime(data.generatedAt);
    newsCountEl.textContent = `${data.news.length} 条资讯`;

    // Generate AI insights
    generateInsights(data.news);

    // Render featured (top 3)
    renderFeatured(data.news.slice(0, 3));

    // Render rest of news
    renderNewsList(data.news.slice(3));

  } catch (error) {
    console.error('Failed to load news:', error);
    featuredGrid.innerHTML = '';
    newsList.innerHTML = '<div class="loading"><p>加载失败，请刷新重试</p></div>';
  }
}

function generateInsights(news) {
  const insightsSection = document.getElementById('insightsSection');
  const insightsContent = document.getElementById('insightsContent');

  const insights = [];

  // Analyze topics for trends
  const topicCounts = {};
  const topicMentions = {};

  const patterns = [
    { regex: /openai|gpt|chatgpt|claude|anthropic/gi, name: 'AI助手' },
    { regex: /google|deepmind|gemini/gi, name: 'Google' },
    { regex: /meta|facebook|instagram/gi, name: 'Meta' },
    { regex: /microsoft|windows|copilot/gi, name: 'Microsoft' },
    { regex: /apple|iphone|macbook/gi, name: 'Apple' },
    { regex: /tesla|elon musk|spacex/gi, name: '特斯拉/Musk' },
    { regex: /security|privacy|hack|breach/gi, name: '安全隐私' },
    { regex: /regulation|eu|law|government/gi, name: '监管政策' },
    { regex: /chip|semiconductor|nvidia|amd/gi, name: '芯片' },
    { regex: /robot|humanoid| Boston Dynamics/gi, name: '机器人' },
  ];

  news.forEach(item => {
    const title = item.title + ' ' + (item.titleZh || '');
    patterns.forEach(p => {
      const matches = title.match(p.regex);
      if (matches) {
        topicCounts[p.name] = (topicCounts[p.name] || 0) + matches.length;
        if (!topicMentions[p.name]) topicMentions[p.name] = [];
        topicMentions[p.name].push(item);
      }
    });
  });

  // Sort topics by frequency
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Generate insights based on analysis
  if (sortedTopics.length > 0) {
    const topTopic = sortedTopics[0];
    insights.push({
      type: 'trending',
      tag: '热门话题',
      text: `近期「${topTopic[0]}」相关讨论显著增加，共${topTopic[1]}次提及，成为本期最受关注的话题。`
    });
  }

  if (sortedTopics.length > 1) {
    const secondTopic = sortedTopics[1];
    insights.push({
      type: 'info',
      tag: '次热门',
      text: `「${secondTopic[0]}」关注度上升，相关内容占${Math.round(secondTopic[1] / news.length * 100)}%。`
    });
  }

  // Check for AI assistant controversies
  const aiAssistantNews = news.filter(item => {
    const title = (item.titleZh || item.title).toLowerCase();
    return /gpt|claude|gemini|llm|ai assistant/gi.test(title);
  });

  if (aiAssistantNews.length > 2) {
    insights.push({
      type: 'info',
      tag: 'AI助手',
      text: `本期收录${aiAssistantNews.length}条AI助手相关动态，包括产品更新、用户反馈等多个维度。`
    });
  }

  // Check for regulation/news
  const regulationNews = news.filter(item => {
    const title = (item.titleZh || item.title).toLowerCase();
    return /regulation|eu|law|government|policy/gi.test(title);
  });

  if (regulationNews.length > 1) {
    insights.push({
      type: 'warning',
      tag: '政策动态',
      text: `「监管政策」话题有${regulationNews.length}条相关报道，AI监管话题持续引发讨论。`
    });
  }

  // Check for conflicting opinions (same topic, different sentiments)
  const techGiants = news.filter(item => {
    const title = (item.titleZh || item.title);
    return /apple|google|meta|microsoft/gi.test(title);
  });

  if (techGiants.length >= 2) {
    insights.push({
      type: 'info',
      tag: '科技巨头',
      text: `${techGiants.length}家科技巨头的动态被收录，大厂在AI领域的布局持续深化。`
    });
  }

  // Check for new releases
  const releaseNews = news.filter(item => {
    const title = (item.titleZh || item.title).toLowerCase();
    return /launch|release|announce|introduce| debut/gi.test(title);
  });

  if (releaseNews.length > 0) {
    insights.push({
      type: 'trending',
      tag: '新品发布',
      text: `本期有${releaseNews.length}条产品发布/更新资讯，AI领域创新活跃。`
    });
  }

  // Render insights
  if (insights.length > 0) {
    insightsSection.style.display = 'block';
    insightsContent.innerHTML = insights.map(insight => `
      <div class="insight-item ${insight.type}">
        <span class="insight-tag ${insight.type}">${insight.tag}</span>
        <span class="insight-text">${insight.text}</span>
      </div>
    `).join('');
  } else {
    insightsSection.style.display = 'none';
  }
}

function renderFeatured(featured) {
  const grid = document.getElementById('featuredGrid');

  const labels = ['🔥 今日最热', '⭐ 推荐阅读', '✨值得关注'];

  grid.innerHTML = featured.map((news, index) => {
    const displayTitle = news.titleZh || news.title;
    const sources = news.source.map(s => `<span class="source-tag ${getSourceClass(s)}">${s}</span>`).join('');

    return `
      <article class="featured-card" onclick="openReader('${news.id}')">
        <span class="featured-rank">${index + 1}</span>
        <span class="featured-label">${labels[index]}</span>
        <h3 class="featured-title">${escapeHtml(displayTitle)}</h3>
        <div class="featured-meta">
          <span class="hotness-badge">${news.hotness.toFixed(1)}</span>
          <div class="featured-sources">${sources}</div>
        </div>
        ${news.summaryZh ? `<p class="featured-summary">${escapeHtml(news.summaryZh)}</p>` : ''}
        <button class="read-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          阅读全文
        </button>
      </article>
    `;
  }).join('');
}

function renderNewsList(newsItems) {
  const newsList = document.getElementById('newsList');

  if (newsItems.length === 0) {
    newsList.innerHTML = '<div class="loading"><p>暂无更多资讯</p></div>';
    return;
  }

  newsList.innerHTML = newsItems.map((news, index) => {
    const displayTitle = news.titleZh || news.title;
    const sources = news.source.map(s => `<span class="source-tag ${getSourceClass(s)}">${s}</span>`).join('');

    return `
      <article class="news-card" onclick="openReader('${news.id}')">
        <div class="news-card-header">
          <span class="news-rank">${index + 4}</span>
          <div class="news-content">
            <h3 class="news-title">${escapeHtml(displayTitle)}</h3>
            <div class="news-meta">
              <span class="hotness-badge">${news.hotness.toFixed(1)}</span>
              ${sources}
            </div>
          </div>
        </div>
        ${news.summaryZh ? `<p class="news-summary">${escapeHtml(news.summaryZh)}</p>` : ''}
      </article>
    `;
  }).join('');
}

function openReader(newsId) {
  const news = currentNewsData.find(n => n.id === newsId);
  if (!news) return;

  const modal = document.getElementById('readerModal');
  const frame = document.getElementById('articleFrame');
  const fallback = document.getElementById('articleFallback');
  const fallbackContent = document.getElementById('fallbackContent');
  const fallbackLink = document.getElementById('fallbackLink');
  const modalSource = document.getElementById('modalSource');
  const modalTitle = document.getElementById('modalTitle');

  modalSource.textContent = news.source[0] || 'AI News';
  modalTitle.textContent = news.titleZh || news.title;
  fallbackLink.href = news.url;

  // Try to embed the article in iframe
  try {
    frame.src = news.url;
    frame.style.display = 'block';
    fallback.style.display = 'none';

    // If iframe fails to load (cross-origin), show fallback
    frame.onerror = () => {
      showFallback(news);
    };

    // Timeout fallback
    setTimeout(() => {
      if (frame.src !== news.url) return;
      const frameDoc = frame.contentDocument;
      if (!frameDoc || frameDoc.body.innerHTML === '') {
        showFallback(news);
      }
    }, 3000);

  } catch (e) {
    showFallback(news);
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showFallback(news) {
  const frame = document.getElementById('articleFrame');
  const fallback = document.getElementById('fallbackContent');
  const fallbackLink = document.getElementById('fallbackLink');

  frame.style.display = 'none';
  fallback.style.display = 'block';

  const displayTitle = news.titleZh || news.title;
  const summary = news.summaryZh || '点击下方按钮前往原文阅读完整内容。';

  fallbackContent.innerHTML = `
    <h1 style="font-size: 1.5rem; margin-bottom: 16px; line-height: 1.3;">${escapeHtml(displayTitle)}</h1>
    <p style="color: var(--text-muted); margin-bottom: 12px; font-size: 0.9rem;">
      发布时间: ${formatDateTime(news.publishedAt * 1000)}
    </p>
    <p style="margin-bottom: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border-left: 3px solid var(--accent);">
      ${escapeHtml(summary)}
    </p>
    <p style="color: var(--text-muted);">
      由于跨域限制，无法在此页面内嵌入原文内容。请点击下方按钮前往原站阅读。
    </p>
  `;

  fallbackLink.href = news.url;
}

function closeReader() {
  const modal = document.getElementById('readerModal');
  const frame = document.getElementById('articleFrame');

  modal.classList.remove('active');
  document.body.style.overflow = '';
  frame.src = 'about:blank';
}

function getSourceClass(source) {
  if (/reddit/i.test(source)) return 'reddit';
  if (/hacker/i.test(source)) return 'hacker';
  if (/(36kr|it之家|虎嗅|少数派)/i.test(source)) return 'chinese';
  return '';
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeReader();
});
