// Daily AI News - Frontend App

const NEWS_FILE = 'news.json';
let currentNewsData = [];
let isModalOpen = false;
let currentIframeTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  initModal();
});

async function loadNews() {
  try {
    const response = await fetch(NEWS_FILE + '?t=' + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    currentNewsData = data.news;

    document.getElementById('updateTime').textContent = formatDateTime(data.generatedAt);
    document.getElementById('newsCount').textContent = `${data.news.length} 条资讯`;

    generateInsights(data.news);
    renderFeatured(data.news.slice(0, 3));
    renderNewsList(data.news.slice(3));
  } catch (error) {
    console.error('Failed to load news:', error);
  }
}

function initModal() {
  const closeBtn = document.getElementById('modalCloseBtn');
  const backdrop = document.getElementById('modalBackdrop');

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      closeModal();
    }
  });
}

function openModal(news) {
  const modal = document.getElementById('readerModal');
  const modalSource = document.getElementById('modalSource');
  const modalTitle = document.getElementById('modalTitle');
  const openExternalBtn = document.getElementById('openExternalBtn');
  const loading = document.getElementById('articleLoading');
  const frame = document.getElementById('articleFrame');

  // Clear any existing timeout
  if (currentIframeTimeout) {
    clearTimeout(currentIframeTimeout);
  }

  // Set modal content
  modalSource.textContent = news.source[0] || 'AI News';
  modalTitle.textContent = news.titleZh || news.title;
  openExternalBtn.href = news.url;

  // Show loading
  loading.classList.remove('hidden');
  frame.style.opacity = '0';

  // Load iframe
  frame.src = news.url;

  // Set timeout to check if iframe loaded
  currentIframeTimeout = setTimeout(() => {
    // Check if iframe has content
    try {
      const frameDoc = frame.contentDocument || frame.contentWindow.document;
      if (frameDoc && frameDoc.body && frameDoc.body.innerHTML.length > 100) {
        // Content loaded successfully
        loading.classList.add('hidden');
        frame.style.opacity = '1';
      } else {
        // Still loading or blocked - keep showing loading
      }
    } catch (e) {
      // Cross-origin blocked - iframe might still be loading or blocked
      // Give it more time
    }
  }, 3000);

  // Hide loading when iframe actually loads
  frame.onload = function() {
    clearTimeout(currentIframeTimeout);
    setTimeout(() => {
      loading.classList.add('hidden');
      frame.style.opacity = '1';
    }, 500);
  };

  modal.classList.add('active');
  isModalOpen = true;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('readerModal');
  const frame = document.getElementById('articleFrame');

  if (currentIframeTimeout) {
    clearTimeout(currentIframeTimeout);
  }

  modal.classList.remove('active');
  isModalOpen = false;
  document.body.style.overflow = '';

  // Clear iframe src after animation
  setTimeout(() => {
    frame.src = 'about:blank';
    frame.style.opacity = '0';
  }, 300);
}

function generateInsights(news) {
  const insightsSection = document.getElementById('insightsSection');
  const insightsContent = document.getElementById('insightsContent');
  const insights = [];
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
  ];

  news.forEach(item => {
    const title = item.title + ' ' + (item.titleZh || '');
    patterns.forEach(p => {
      if (p.regex.test(title)) {
        topicCounts[p.name] = (topicCounts[p.name] || 0) + 1;
      }
    });
  });

  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (sortedTopics.length > 0) {
    insights.push({
      type: 'trending',
      tag: '🔥 热门话题',
      text: `「${sortedTopics[0][0]}」本期最热，共${sortedTopics[0][1]}条相关内容。`
    });
  }

  if (sortedTopics.length > 1) {
    insights.push({
      type: 'info',
      tag: '📊 值得关注',
      text: `「${sortedTopics[1][0]}」关注度上升（${sortedTopics[1][1]}条），近期动态频繁。`
    });
  }

  if (insights.length > 0) {
    insightsSection.style.display = 'block';
    insightsContent.innerHTML = insights.map(i => `
      <div class="insight-item ${i.type}">
        <span class="insight-tag ${i.type}">${i.tag}</span>
        <span class="insight-text">${i.text}</span>
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
    const title = escapeHtml(news.titleZh || news.title);
    const sources = news.source.map(s => `<span class="source-tag ${getSourceClass(s)}">${escapeHtml(s)}</span>`).join('');

    return `
      <article class="featured-card" onclick="openArticle('${news.id}')">
        <span class="featured-rank">${index + 1}</span>
        <span class="featured-label">${labels[index]}</span>
        <h3 class="featured-title">${title}</h3>
        <div class="featured-meta">
          <span class="hotness-badge">${news.hotness.toFixed(1)}</span>
          <div class="featured-sources">${sources}</div>
        </div>
        ${news.summaryZh ? `<p class="featured-summary">${escapeHtml(news.summaryZh)}</p>` : ''}
        <button class="read-btn" onclick="event.stopPropagation(); openArticle('${news.id}')">
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
    const title = escapeHtml(news.titleZh || news.title);
    const sources = news.source.map(s => `<span class="source-tag ${getSourceClass(s)}">${escapeHtml(s)}</span>`).join('');

    return `
      <article class="news-card" onclick="openArticle('${news.id}')">
        <div class="news-card-header">
          <span class="news-rank">${index + 4}</span>
          <div class="news-content">
            <h3 class="news-title">${title}</h3>
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

window.openArticle = function(id) {
  const news = currentNewsData.find(n => n.id === id);
  if (news) {
    openModal(news);
  }
};

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
