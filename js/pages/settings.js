/* ============================================
   ARE YOU DELULU - Settings Page
   ============================================ */

const Settings = {
  render() {
    console.log('[Settings] render() called');
    
    const profile = Auth.getProfile();
    
    const content = `
      <div class="settings-page">
        <div class="page-header">
          <h1 class="page-title">Impostazioni</h1>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Account</h3>
          <div class="settings-item">
            <div>
              <p class="settings-item-label">${profile?.name || 'Utente'}</p>
              <p class="settings-item-description">${profile?.email || ''}</p>
            </div>
          </div>
          <div class="settings-item">
            <div>
              <p class="settings-item-label">Piano</p>
              <p class="settings-item-description">${profile?.tier === 'premium' ? 'Premium ✨' : 'Gratuito'}</p>
            </div>
            ${profile?.tier === 'premium' ? `
              <button onclick="Utils.openCustomerPortal()" class="btn btn-secondary btn-sm">Gestisci</button>
            ` : `
              <button onclick="Utils.showPremiumModal()" class="btn btn-accent btn-sm">Upgrade</button>
            `}
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Supporto</h3>
          <div class="settings-item">
            <div>
              <p class="settings-item-label">Risorse di supporto</p>
              <p class="settings-item-description">Se ti trovi in una situazione difficile</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Settings.showSupportResources()">
              Mostra
            </button>
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Dati</h3>
          <div class="settings-item">
            <div>
              <p class="settings-item-label">Esporta dati</p>
              <p class="settings-item-description">Scarica tutti i tuoi dati (GDPR)</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Settings.exportData()">
              Esporta
            </button>
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Azioni</h3>
          <div class="settings-item">
            <button class="btn btn-secondary" onclick="Settings.handleLogout()">
              Esci
            </button>
          </div>
          <div class="settings-item">
            <button class="btn btn-ghost text-error" onclick="Settings.handleDeleteAccount()">
              Elimina account
            </button>
          </div>
        </div>
      </div>
    `;
    
    App.renderShell(content, { showBack: true });
  },
  
  showSupportResources() {
    const modal = document.createElement('div');
    modal.id = 'support-modal';
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Risorse di supporto</h3>
          <button class="modal-close" onclick="document.getElementById('support-modal').remove()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="mb-md">Se ti trovi in una situazione che non ti fa sentire al sicuro, ecco alcune risorse che possono aiutarti:</p>
          
          <div class="mb-md">
            <p class="font-semibold">🆘 Emergenze</p>
            <p class="text-secondary">112 (Numero unico emergenze)</p>
          </div>
          
          <div class="mb-md">
            <p class="font-semibold">💜 Telefono Rosa</p>
            <p class="text-secondary">1522 (Antiviolenza, 24/7, gratuito)</p>
          </div>
          
          <div class="mb-md">
            <p class="font-semibold">💙 Telefono Amico</p>
            <p class="text-secondary">02 2327 2327</p>
          </div>
          
          <div>
            <p class="font-semibold">🌐 Centro Antiviolenza</p>
            <p class="text-secondary">www.direcontrolaviolenza.it</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="document.getElementById('support-modal').remove()">
            Chiudi
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },
  
  async exportData() {
    Utils.showToast('Esportazione in corso...', 'info');
    
    try {
      const userId = Auth.getUser().id;
      
      // Fetch all user data
      const { data: profile } = await db
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: guys } = await db
        .from('guys')
        .select('*')
        .eq('user_id', userId);
      
      const guyIds = (guys || []).map(g => g.id);
      
      let proCons = [];
      let chats = [];
      
      if (guyIds.length > 0) {
        const { data: pcData } = await db
          .from('pro_cons')
          .select('*')
          .in('guy_id', guyIds);
        proCons = pcData || [];
        
        const { data: chatData } = await db
          .from('chats')
          .select('*')
          .in('guy_id', guyIds);
        chats = chatData || [];
      }
      
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: {
          name: profile?.name,
          email: profile?.email,
          date_of_birth: profile?.date_of_birth,
          tier: profile?.tier,
          created_at: profile?.created_at
        },
        guys: guys?.map(g => ({
          name: g.name,
          how_met: g.how_met,
          created_at: g.created_at,
          pro_cons: proCons.filter(pc => pc.guy_id === g.id).map(pc => ({
            type: pc.type,
            text: pc.text,
            weight: pc.weight,
            is_dealbreaker: pc.is_dealbreaker
          })),
          chats: chats.filter(c => c.guy_id === g.id).map(c => ({
            tone: c.tone,
            messages: c.messages,
            created_at: c.created_at
          }))
        }))
      };
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `areyoudelulu-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      Utils.showToast('Dati esportati!', 'success');
      
    } catch (err) {
      console.error('[Settings] Export error:', err);
      Utils.showToast('Errore nell\'esportazione', 'error');
    }
  },
  
  async handleLogout() {
    await Auth.signOut();
    window.location.hash = '';
    Landing.init();
  },
  
  async handleDeleteAccount() {
    if (!confirm('Sei sicura? Tutti i tuoi dati verranno eliminati permanentemente.')) {
      return;
    }
    
    if (!confirm('Ultima conferma: vuoi davvero eliminare il tuo account?')) {
      return;
    }
    
    const { error } = await Auth.deleteAccount();
    
    if (error) {
      Utils.showToast('Errore durante l\'eliminazione', 'error');
      return;
    }
    
    Utils.showToast('Account eliminato', 'success');
    window.location.hash = '';
    Landing.init();
  }
};

window.Settings = Settings;