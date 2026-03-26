// Daily AI News - Frontend App

const NEWS_FILE = 'news.json';

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  setupRefreshButton();
});

async function loadNews() {
  const newsList = document.getElementById('newsList');
  const errorMessage = document.getElementById('errorMessage');
  const updateTimeEl = document.getElementById('updateTime');

  try {
    newsList.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>正在加载新闻...</p>
      </div>
    `;
    errorMessage.style.display = 'none';

    const response = await fetch(NEWS_FILE + '?t=' + Date.now());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Update timestamp
    updateTimeEl.textContent = formatDateTime(data.generatedAt);

    if (!data.news || data.news.length === 0) {
      newsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📰</div>
          <p>暂无新闻数据</p>
        </div>
      `;
      return;
    }

    // Calculate max hotness for bar width
    const maxHotness = Math.max(...data.news.map(n => n.hotness));

    // Render news cards
    newsList.innerHTML = data.news.map((news, index) => {
      const displayTitle = news.titleZh || news.title;
      const hasChinese = news.titleZh && news.titleZh !== news.title;

      return `
      <article class="news-card" data-id="${news.id}">
        <div class="news-header" onclick="toggleDetails('${news.id}')">
          <span class="news-rank">${index + 1}</span>
          <div class="news-content">
            <h2 class="news-title">${escapeHtml(displayTitle)}</h2>
            ${hasChinese ? `<div class="original-title">原文: ${escapeHtml(news.title)}</div>` : ''}
            <div class="news-meta">
              <div class="hotness-container">
                <span class="hotness-badge">${news.hotness.toFixed(1)}</span>
                <div class="hotness-bar">
                  <div class="hotness-fill" style="width: ${getBarWidth(news.hotness, maxHotness)}%"></div>
                </div>
              </div>
              <div class="source-tags">
                ${news.source.map(s => `<span class="source-tag ${getSourceClass(s)}">${escapeHtml(s)}</span>`).join('')}
              </div>
            </div>
          </div>
          <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="news-details" id="details-${news.id}">
          ${news.summaryZh ? `
          <div class="detail-section">
            <div class="detail-label">摘要</div>
            <div class="detail-value summary">${escapeHtml(news.summaryZh)}</div>
          </div>
          ` : ''}
          <div class="detail-section">
            <div class="detail-label">原始链接</div>
            <a href="${escapeHtml(news.url)}" target="_blank" rel="noopener" class="news-link">
              ${escapeHtml(truncateUrl(news.url))}
            </a>
          </div>
          <div class="detail-section">
            <div class="detail-label">发布时间</div>
            <div class="detail-value">${formatDateTime(news.publishedAt * 1000)}</div>
          </div>
          ${renderStats(news)}
        </div>
      </article>
    `}).join('');

  } catch (error) {
    console.error('Failed to load news:', error);
    newsList.innerHTML = '';
    errorMessage.style.display = 'block';
  }
}

function toggleDetails(id) {
  const card = document.querySelector(`.news-card[data-id="${id}"]`);
  if (card) {
    card.classList.toggle('expanded');
  }
}

function setupRefreshButton() {
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('loading');
    loadNews().finally(() => {
      setTimeout(() => refreshBtn.classList.remove('loading'), 500);
    });
  });
}

function renderStats(news) {
  const stats = [];

  if (news.redditScore !== undefined) {
    stats.push({ icon: '📊', label: 'Reddit', value: news.redditScore.toFixed(2) });
  }
  if (news.hnScore !== undefined) {
    stats.push({ icon: '📊', label: 'HN', value: news.hnScore.toFixed(2) });
  }
  if (news.cnScore !== undefined) {
    stats.push({ icon: '📊', label: '国内', value: news.cnScore.toFixed(2) });
  }

  if (stats.length === 0) return '';

  return `
    <div class="detail-section">
      <div class="detail-label">热度分解</div>
      <div class="stats-row">
        ${stats.map(s => `
          <div class="stat-item">
            <span class="stat-icon">${s.icon}</span>
            <span>${s.label}: ${s.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getSourceClass(source) {
  if (source.includes('Reddit')) return 'source-reddit';
  if (source.includes('Hacker')) return 'source-hn';
  if (['36氪', 'IT之家', '虎嗅', '少数派'].some(s => source.includes(s))) return 'source-cn';
  return '';
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBarWidth(hotness, maxHotness) {
  if (maxHotness === 0) return 0;
  return Math.max(5, (hotness / maxHotness * 100)).toFixed(1);
}

function truncateUrl(url, maxLength = 60) {
  try {
    const u = new URL(url);
    let display = u.hostname + u.pathname;
    if (display.length > maxLength) {
      display = display.substring(0, maxLength - 3) + '...';
    }
    return display;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
