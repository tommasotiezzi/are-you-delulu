/* ============================================
   ARE YOU DELULU - Dashboard Page
   ============================================ */

const Dashboard = {
  async render() {
    console.log('[Dashboard] render() called');
    
    const renderId = App.getRenderId();
    
    App.renderShell(`
      <div class="page-loader">
        <div class="spinner"></div>
      </div>
    `);
    
    try {
      // Fetch guys
      console.log('[Dashboard] Fetching guys from database...');
      
      const { data: guys, error } = await db
        .from('guys')
        .select('*')
        .order('updated_at', { ascending: false });
      
      // Check if we navigated away during fetch
      if (!App.shouldRender(renderId)) {
        console.log('[Dashboard] Stale render, aborting');
        return;
      }
      
      console.log('[Dashboard] Guys fetch result:', { guys, error });
      
      if (error) {
        console.error('[Dashboard] Error loading guys:', error);
        Utils.showToast('Errore nel caricamento', 'error');
        return;
      }
      
      // Fetch pro_cons for all guys to calculate scores
      const guyIds = (guys || []).map(g => g.id);
      let proCons = [];
      
      if (guyIds.length > 0) {
        const { data: pcData, error: pcError } = await db
          .from('pro_cons')
          .select('*')
          .in('guy_id', guyIds);
        console.log('[Dashboard] Pro_cons fetch result:', { pcData, pcError });
        proCons = pcData || [];
      }
      
      // Group pro_cons by guy
      const proConsByGuy = {};
      proCons.forEach(pc => {
        if (!proConsByGuy[pc.guy_id]) proConsByGuy[pc.guy_id] = [];
        proConsByGuy[pc.guy_id].push(pc);
      });
      
      const profile = Auth.getProfile();
      const canAdd = Utils.canAddGuy(profile, (guys || []).length);
      
      let content = `
        <div class="dashboard-header">
          <div>
            <h1 class="page-title">I tuoi ragazzi</h1>
            <p class="page-subtitle">Ciao ${profile?.name || ''}! ${(guys || []).length === 0 ? 'Nessun ragazzo ancora' : `${(guys || []).length} ragazzo/i`}</p>
          </div>
          <a href="#/patterns" class="btn btn-secondary">
            Il tuo tipo
            <span class="btn-info-icon" data-tooltip="Analizza i pro e contro che scrivi più spesso per scoprire cosa cerchi davvero">ⓘ</span>
          </a>
        </div>
      `;
      
      // Always show the grid (with add card if allowed)
      content += '<div class="guys-grid">';
      
      // Render existing guy cards
      (guys || []).forEach(guy => {
        const guyProCons = proConsByGuy[guy.id] || [];
        const score = Utils.calculateScore(guyProCons);
        const category = Utils.getScoreCategory(score.percentage, score.hasDealbreaker);
        
        content += `
          <div class="card card-clickable guy-card" onclick="window.location.hash='#/guy/${guy.id}'">
            <div class="card-body">
              <div class="guy-card-header">
                <h3 class="guy-card-name">${Utils.escapeHtml(guy.name)}</h3>
                <div class="score-badge ${category}">
                  <span class="score-dot ${category}"></span>
                  ${score.percentage}%
                </div>
              </div>
              <div class="guy-card-meta">
                <span class="guy-card-count">
                  <span class="text-positive">${score.proCount} pro</span>
                  <span>•</span>
                  <span class="text-negative">${score.conCount} contro</span>
                </span>
              </div>
              <p class="guy-card-timestamp">${Utils.formatRelativeTime(guy.updated_at)}</p>
            </div>
          </div>
        `;
      });
      
      // Add card - always show, locked if at limit
      if (canAdd) {
        content += `
          <a href="#/add-guy" class="card card-clickable guy-card guy-card-add">
            <div class="card-body">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Aggiungi</span>
            </div>
          </a>
        `;
      } else {
        content += `
          <div class="card guy-card guy-card-add guy-card-locked" onclick="Utils.showPremiumModal()">
            <div class="card-body">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Aggiungi</span>
              <span class="locked-badge">🔒 Limite raggiunto</span>
            </div>
          </div>
        `;
      }
      
      content += '</div>';
      
      console.log('[Dashboard] Rendering final content');
      App.renderShell(content);
      
    } catch (err) {
      console.error('[Dashboard] EXCEPTION:', err);
      Utils.showToast('Errore nel caricamento', 'error');
      
      // Show error state
      App.renderShell(`
        <div class="empty-state">
          <h3 class="empty-state-title">Errore di connessione</h3>
          <p class="empty-state-text">Impossibile caricare i dati</p>
          <button class="btn btn-primary" onclick="location.reload()">Ricarica pagina</button>
        </div>
      `);
    }
  }
};

window.Dashboard = Dashboard;