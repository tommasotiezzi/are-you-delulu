/* ============================================
   ARE YOU DELULU - Patterns Page (Il tuo tipo)
   ============================================ */

const Patterns = {
  currentTab: 'pro',
  
  async render() {
    console.log('[Patterns] render() called');
    
    // Check URL for tab
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    this.currentTab = urlParams.get('type') || 'pro';
    
    const renderId = App.getRenderId();
    
    App.renderShell(`
      <div class="page-loader">
        <div class="spinner"></div>
      </div>
    `, { showBack: true });
    
    try {
      const userId = Auth.getUser()?.id;
      const profile = Auth.getProfile();
      const canViewRedFlags = Utils.canViewRedFlags(profile);
      
      // Fetch pro patterns
      const { data: proPatterns, error: proError } = await db.rpc('get_patterns', {
        user_uuid: userId,
        pattern_type: 'pro'
      });

      // Check if we navigated away
      if (!App.shouldRender(renderId)) {
        console.log('[Patterns] Stale render, aborting');
        return;
      }

      // Decrypt pro patterns text
      if (proPatterns && proPatterns.length > 0) {
        const proTexts = proPatterns.map(p => p.text);
        const decryptedProTexts = await Utils.decryptTexts(proTexts);
        proPatterns.forEach((p, i) => {
          p.text = decryptedProTexts[i];
        });
      }

      // Fetch con patterns (only if allowed)
      let conPatterns = [];
      if (canViewRedFlags) {
        const { data: conData } = await db.rpc('get_patterns', {
          user_uuid: userId,
          pattern_type: 'con'
        });
        conPatterns = conData || [];

        // Decrypt con patterns text
        if (conPatterns.length > 0) {
          const conTexts = conPatterns.map(p => p.text);
          const decryptedConTexts = await Utils.decryptTexts(conTexts);
          conPatterns.forEach((p, i) => {
            p.text = decryptedConTexts[i];
          });
        }
      }
      
      const content = `
        <div class="patterns-page">
          <div class="page-header">
            <h1 class="page-title">Il tuo tipo</h1>
            <p class="page-subtitle">Cosa cerchi sempre... e cosa odi sempre</p>
          </div>
          
          <!-- Tabs -->
          <div class="patterns-tabs">
            <button class="patterns-tab ${this.currentTab === 'pro' ? 'active' : ''}" onclick="Patterns.switchTab('pro')">
              💚 Green Flag
            </button>
            <button class="patterns-tab ${this.currentTab === 'con' ? 'active' : ''} ${!canViewRedFlags ? 'locked' : ''}" onclick="${canViewRedFlags ? "Patterns.switchTab('con')" : "Utils.showPremiumModal()"}">
              🚩 Red Flag ${!canViewRedFlags ? '🔒' : ''}
            </button>
          </div>
          
          <!-- Content -->
          <div class="patterns-content">
            ${this.currentTab === 'pro' ? this.renderList(proPatterns, 'pro') : ''}
            ${this.currentTab === 'con' && canViewRedFlags ? this.renderList(conPatterns, 'con') : ''}
          </div>
        </div>
      `;
      
      App.renderShell(content, { showBack: true });
      
    } catch (err) {
      console.error('[Patterns] EXCEPTION:', err);
      Utils.showToast('Errore nel caricamento', 'error');
    }
  },
  
  renderList(patterns, type) {
    const isGreen = type === 'pro';
    
    if (!patterns || patterns.length === 0) {
      return `
        <div class="empty-state">
          <p class="empty-state-text">
            ${isGreen 
              ? 'Aggiungi più pro a diversi ragazzi per scoprire cosa cerchi davvero' 
              : 'Aggiungi più contro a diversi ragazzi per scoprire le tue red flag ricorrenti'}
          </p>
        </div>
      `;
    }
    
    return `
      <div class="patterns-list">
        ${patterns.map((p, i) => `
          <div class="pattern-item ${isGreen ? '' : 'pattern-negative'} ${i < 3 ? 'pattern-top' : ''}">
            <div class="pattern-rank">${i + 1}</div>
            <div class="pattern-content">
              <span class="pattern-text">${Utils.escapeHtml(p.text)}</span>
              <span class="pattern-frequency">${p.frequency} ragazzi</span>
            </div>
          </div>
        `).join('')}
      </div>
      ${!isGreen && patterns.length > 0 ? `
        <div class="patterns-insight">
          <p class="text-secondary text-sm">
            💡 Hai scritto "${Utils.escapeHtml(patterns[0]?.text || '')}" per ${patterns[0]?.frequency || 0} ragazzi diversi. 
            Forse è ora di iniziare a notarlo prima?
          </p>
        </div>
      ` : ''}
    `;
  },
  
  switchTab(tab) {
    this.currentTab = tab;
    window.location.hash = `#/patterns?type=${tab}`;
  }
};

window.Patterns = Patterns;