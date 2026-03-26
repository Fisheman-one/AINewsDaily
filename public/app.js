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

  const patterns = [
    { regex: /openai|gpt|chatgpt|claude|anthropic|llm/gi, name: 'AI助手/LLM' },
    { regex: /google|deepmind|gemini/gi, name: 'Google/DeepMind' },
    { regex: /meta|facebook|instagram|llama/gi, name: 'Meta' },
    { regex: /microsoft|windows|copilot/gi, name: 'Microsoft' },
    { regex: /apple|iphone|macbook|ipad/gi, name: 'Apple' },
    { regex: /tesla|elon musk|spacex/gi, name: '特斯拉/Musk' },
    { regex: /security|privacy|hack|breach|vulnerability/gi, name: '安全隐私' },
    { regex: /regulation|eu|law|government|policy|gdpr/gi, name: '监管政策' },
    { regex: /chip|semiconductor|nvidia|amd|gpu/gi, name: '芯片/硬件' },
    { regex: /robot|humanoid| Boston Dynamics|figure/gi, name: '机器人' },
    { regex: /startup|funding|invest|Series [A-Z]/gi, name: '创业投资' },
    { regex: /open.?source|github|repository/gi, name: '开源' },
  ];

  news.forEach(item => {
    const title = item.title + ' ' + (item.titleZh || '');
    patterns.forEach(p => {
      const matches = title.match(p.regex);
      if (matches) {
        topicCounts[p.name] = (topicCounts[p.name] || 0) + matches.length;
      }
    });
  });

  // Sort topics by frequency
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Generate insights
  if (sortedTopics.length > 0) {
    const topTopic = sortedTopics[0];
    insights.push({
      type: 'trending',
      tag: '🔥 热门话题',
      text: `「${topTopic[0]}」是本期最热门话题，共出现${topTopic[1]}次，相关讨论持续升温。`
    });
  }

  if (sortedTopics.length > 1) {
    const secondTopic = sortedTopics[1];
    const percentage = Math.round(secondTopic[1] / news.length * 100);
    insights.push({
      type: 'info',
      tag: '📊 值得关注',
      text: `「${secondTopic[0]}」关注度上升（占${percentage}%），近期有较多相关动态。`
    });
  }

  // Check for new product releases
  const releaseKeywords = /launch|release|announce|introduce|debut|unveil|new version|beta/gi;
  const releaseNews = news.filter(item => {
    const title = (item.titleZh || item.title);
    return releaseKeywords.test(title);
  });

  if (releaseNews.length >= 2) {
    insights.push({
      type: 'trending',
      tag: '🚀 新品发布',
      text: `本期有${releaseNews.length}条产品发布/更新资讯，AI领域创新活跃度保持高位。`
    });
  }

  // Check for regulation
  const regulationNews = news.filter(item => {
    const title = (item.titleZh || item.title).toLowerCase();
    return /regulation|eu|law|government|policy|ban|restrict/gi.test(title);
  });

  if (regulationNews.length >= 1) {
    insights.push({
      type: 'warning',
      tag: '⚖️ 政策动态',
      text: `「监管政策」类话题有${regulationNews.length}条报道，AI监管讨论持续引发关注。`
    });
  }

  // Check for mixed sentiment (controversy indicators)
  const controversyKeywords = /but|however|though|not great|underwhelming|disappointed|controversy|backlash|concern/gi;
  const controversyNews = news.filter(item => {
    const title = (item.titleZh || item.title);
    return controversyKeywords.test(title);
  });

  if (controversyNews.length >= 1) {
    insights.push({
      type: 'warning',
      tag: '💭 用户反馈',
      text: `部分新闻反映出用户对某些产品/功能的实际体验存在争议，值得关注。`
    });
  }

  // Check for Chinese tech
  const chineseTech = news.filter(item => {
    const title = (item.titleZh || item.title);
    return /中国|华为|阿里|腾讯|百度|字节/gi.test(title);
  });

  if (chineseTech.length >= 2) {
    insights.push({
      type: 'info',
      tag: '🇨🇳 国内动态',
      text: `本期收录${chineseTech.length}条国内科技新闻，中国AI发展持续受关注。`
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

  const labels = ['🔥 今日最热', '⭐ 推荐阅读', '✨ 值得关注'];

  grid.innerHTML = featured.map((news, index) => {
    const displayTitle = news.titleZh || news.title;
    const sources = news.source.map(s => `<span class="source-tag ${getSourceClass(s)}">${s}</span>`).join('');

    return `
      <article class="featured-card" data-id="${news.id}">
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

  // Add click handlers
  grid.querySelectorAll('.featured-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      openReader(id);
    });
  });
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
      <article class="news-card" data-id="${news.id}">
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

  // Add click handlers
  newsList.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      openReader(id);
    });
  });
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

  // Set modal content
  modalSource.textContent = news.source[0] || 'AI News';
  modalTitle.textContent = news.titleZh || news.title;
  fallbackLink.href = news.url;

  // Show fallback directly (iframe embedding is problematic due to cross-origin)
  // This is more reliable and prevents the black screen issue
  frame.style.display = 'none';
  fallback.style.display = 'block';

  // Build fallback content
  const displayTitle = news.titleZh || news.title;
  const summary = news.summaryZh || '点击下方按钮前往原文阅读完整内容。';

  fallbackContent.innerHTML = `
    <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; line-height: 1.3; color: var(--text-primary);">
      ${escapeHtml(displayTitle)}
    </h1>
    <p class="fallback-meta">
      发布时间: ${formatDateTime(news.publishedAt * 1000)}
    </p>
    <div class="fallback-summary">
      ${escapeHtml(summary)}
    </div>
    <p class="fallback-note">
      由于技术限制，无法在此页面内嵌入原文内容。请点击下方按钮前往原站阅读完整文章。
    </p>
    <a href="${escapeHtml(news.url)}" target="_blank" rel="noopener" class="open-original-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
      在原站阅读全文
    </a>
  `;

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReader() {
  const modal = document.getElementById('readerModal');
  const frame = document.getElementById('articleFrame');

  modal.classList.remove('active');
  document.body.style.overflow = '';

  // Clear iframe src after animation
  setTimeout(() => {
    frame.src = 'about:blank';
  }, 300);
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

// Close modal on Escape key or backdrop click
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeReader();
});

document.querySelector('.modal-backdrop')?.addEventListener('click', closeReader);
