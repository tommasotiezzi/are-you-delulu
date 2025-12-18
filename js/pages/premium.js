/* ============================================
   ARE YOU DELULU - Premium Page
   ============================================ */

const Premium = {
  render() {
    console.log('[Premium] render() called');
    
    const profile = Auth.getProfile();
    
    const content = `
      <div class="premium-page">
        ${profile?.tier === 'premium' ? `
          <div class="premium-success">
            <div class="premium-success-icon">🎉</div>
            <h1>Sei Premium!</h1>
            <p class="text-secondary">Grazie per il tuo supporto. Hai accesso a tutto.</p>
            <a href="#/dashboard" class="btn btn-primary mt-lg">Torna alla dashboard</a>
          </div>
        ` : `
          <div class="premium-card">
            <div class="premium-header">
              <span class="premium-emoji">✨</span>
              <h1>Basta limiti</h1>
              <p>Traccia tutti i tuoi tipi, scopri i tuoi pattern, chatta senza freni</p>
            </div>
            
            <div class="premium-perks">
              <div class="premium-perk">
                <span class="premium-perk-icon">👥</span>
                <div>
                  <strong>50 ragazzi</strong>
                  <span>invece di 2</span>
                </div>
              </div>
              <div class="premium-perk">
                <span class="premium-perk-icon">💬</span>
                <div>
                  <strong>20 chat per tipo</strong>
                  <span>invece di 1</span>
                </div>
              </div>
              <div class="premium-perk">
                <span class="premium-perk-icon">🎭</span>
                <div>
                  <strong>Tutti i toni AI</strong>
                  <span>brutale, comprensivo...</span>
                </div>
              </div>
              <div class="premium-perk">
                <span class="premium-perk-icon">🚩</span>
                <div>
                  <strong>Red Flag sbloccate</strong>
                  <span>scopri i tuoi pattern</span>
                </div>
              </div>
            </div>
            
            <div class="premium-cta">
              <button class="btn btn-primary btn-lg btn-block" onclick="Premium.subscribe('yearly')">
                Sblocca tutto a €9.99/anno
              </button>
              <p class="premium-alt">
                oppure <button class="btn-link" onclick="Premium.subscribe('weekly')">€1.49/settimana</button>
              </p>
            </div>
            
            <p class="premium-footer">
              Cancella quando vuoi • Pagamenti sicuri con Stripe
            </p>
          </div>
        `}
      </div>
    `;
    
    App.renderShell(content, { showBack: true });
  },
  
  async subscribe(plan) {
    console.log('[Premium] subscribe() called, plan:', plan);
    
    // TODO: Integrate with Stripe
    Utils.showToast('I pagamenti saranno disponibili a breve!', 'info');
  }
};

window.Premium = Premium;