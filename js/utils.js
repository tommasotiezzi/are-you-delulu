/* ============================================
   ARE YOU DELULU - Utility Functions
   ============================================ */

const Utils = {
  // ============================================
  // Timeout wrapper for async operations
  // ============================================
  
  withTimeout(promise, ms = 10000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      )
    ]);
  },
  
  // ============================================
  // Age Validation
  // ============================================
  
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },
  
  isAdult(dateOfBirth) {
    return this.calculateAge(dateOfBirth) >= 18;
  },
  
  // ============================================
  // Score Calculation
  // ============================================
  
  calculateScore(proCons) {
    const pros = proCons.filter(item => item.type === 'pro');
    const cons = proCons.filter(item => item.type === 'con');
    
    const proTotal = pros.reduce((sum, item) => sum + item.weight, 0);
    const conTotal = cons.reduce((sum, item) => sum + item.weight, 0);
    const total = proTotal + conTotal;
    
    const percentage = total === 0 ? 50 : Math.round((proTotal / total) * 100);
    const hasDealbreaker = cons.some(item => item.is_dealbreaker);
    
    return {
      percentage,
      hasDealbreaker,
      proTotal,
      conTotal,
      proCount: pros.length,
      conCount: cons.length
    };
  },
  
  getScoreCategory(percentage, hasDealbreaker) {
    if (hasDealbreaker) return 'negative';
    if (percentage <= 35) return 'negative';
    if (percentage <= 65) return 'neutral';
    return 'positive';
  },
  
  // ============================================
  // Verdict Text (Italian)
  // ============================================
  
  verdicts: {
    negative: [
      'Scappa',
      'No, proprio no',
      "L'asticella è sottoterra e lui sta facendo limbo",
      'Anche la tua terapista direbbe basta',
      'Il delulu non è più solulu'
    ],
    neutral: [
      'Meh',
      'Ni',
      'La matematica non sta matematicando',
      'Potrebbe andare peggio, potrebbe andare meglio',
      'Giuria ancora in deliberazione'
    ],
    positive: [
      'Vai',
      'Forse non sei delulu questa volta',
      'Green flag detected (avvistamento raro)',
      'Potrebbe essere decente??',
      'Bloccalo prima del prossimo Mercurio retrogrado'
    ]
  },
  
  getRandomVerdict(category) {
    const options = this.verdicts[category];
    return options[Math.floor(Math.random() * options.length)];
  },
  
  // ============================================
  // Weight Labels (Italian)
  // ============================================
  
  weightLabels: {
    pro: {
      1: 'Meh ok',
      3: 'Sì dai',
      5: 'QUESTO SÌ'
    },
    con: {
      1: 'Sopravvivo',
      3: 'Non mi piace',
      5: 'No proprio no'
    }
  },
  
  getWeightLabel(type, weight) {
    return this.weightLabels[type]?.[weight] || '';
  },
  
  // ============================================
  // How Met Labels (Italian)
  // ============================================
  
  howMetLabels: {
    app: 'App di dating',
    school: 'Scuola / Università',
    work: 'Lavoro',
    friends: 'Amici in comune',
    gym: 'Palestra',
    other: 'Altro'
  },
  
  getHowMetLabel(key) {
    return this.howMetLabels[key] || key;
  },
  
  // ============================================
  // Date Formatting
  // ============================================
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },
  
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    
    return this.formatDate(dateString);
  },
  
  // ============================================
  // Toast Notifications
  // ============================================
  
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  },
  
  // ============================================
  // Modal Management
  // ============================================
  
  showModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  
  hideModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  },
  
  // Show premium upsell modal
  showPremiumModal() {
    // Remove existing modal if any
    document.getElementById('premium-modal')?.remove();
    
    const modal = document.createElement('div');
    modal.id = 'premium-modal';
    modal.className = 'modal-backdrop active modal-blur';
    modal.innerHTML = `
      <div class="modal premium-modal">
        <button class="modal-close-btn" id="premium-modal-close">✕</button>
        <div class="premium-modal-header">
          <span class="premium-emoji">✨</span>
          <h2>Basta limiti</h2>
          <p>Sblocca tutto il potenziale</p>
        </div>
        <div class="premium-modal-body">
          <div class="premium-perks-mini">
            <div class="premium-perk-mini">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <strong>50 ragazzi</strong>
            </div>
            <div class="premium-perk-mini">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <strong>20 chat</strong> per tipo
            </div>
            <div class="premium-perk-mini">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
              <strong>Tutti i toni</strong> AI
            </div>
            <div class="premium-perk-mini">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              <strong>Red Flag</strong> sbloccate
            </div>
          </div>
          
          <button class="btn btn-primary btn-lg btn-block" onclick="Utils.subscribePremium('yearly')">
            Sblocca tutto a €9.99/anno
          </button>
          <p class="premium-alt">
            oppure <button class="btn-link" onclick="Utils.subscribePremium('weekly')">€1.49/settimana</button>
          </p>
          
          <p class="text-xs text-secondary mt-md">Cancella quando vuoi</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    document.getElementById('premium-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },
  
  // Handle premium subscription
  async subscribePremium(plan) {
    console.log('[Utils] subscribePremium:', plan);
    
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    
    if (!user || !profile) {
      this.showToast('Devi essere loggato', 'error');
      return;
    }
    
    try {
      // Show loading state
      const btn = document.querySelector('.premium-modal .btn-primary');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Caricamento...';
      }
      
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan,
          userId: user.id,
          userEmail: user.email
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('[Utils] subscribePremium error:', err);
      this.showToast('Errore nel pagamento. Riprova.', 'error');
      
      // Reset button
      const btn = document.querySelector('.premium-modal .btn-primary');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sblocca tutto a €9.99/anno';
      }
    }
  },
  
  // Open customer portal to manage subscription
  async openCustomerPortal() {
    const user = Auth.getUser();
    
    if (!user) {
      this.showToast('Devi essere loggato', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      window.location.href = data.url;
      
    } catch (err) {
      console.error('[Utils] openCustomerPortal error:', err);
      this.showToast('Errore. Riprova.', 'error');
    }
  },
  
  // ============================================
  // Disclaimer Management
  // ============================================
  
  hasAcceptedDisclaimer() {
    return localStorage.getItem('delulu_disclaimer_accepted') === 'true';
  },
  
  acceptDisclaimer() {
    localStorage.setItem('delulu_disclaimer_accepted', 'true');
  },
  
  // ============================================
  // Form Validation
  // ============================================
  
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  validatePassword(password) {
    return password.length >= 6;
  },
  
  // ============================================
  // Tier Checks
  // ============================================
  
  canAddGuy(user, guyCount) {
    if (user.tier === 'premium') return true;
    return guyCount < 2;
  },
  
  canCreateChat(user, chatCount) {
    if (user.tier === 'premium') return true;
    return chatCount < (1 + (user.extra_chats_unlocked || 0));
  },
  
  canUseTone(user, tone) {
    if (user.tier === 'premium') return true;
    if (tone === 'sarcastic') return true;
    
    const unlockedTones = user.unlocked_tones || {};
    const unlockTime = unlockedTones[tone];
    
    if (!unlockTime) return false;
    return new Date(unlockTime) > new Date();
  },
  
  canViewRedFlags(user) {
    if (!user) return false;
    if (user.tier === 'premium') return true;
    
    const unlockTime = user.unlocked_red_flags_until;
    if (!unlockTime) return false;
    return new Date(unlockTime) > new Date();
  },
  
  // ============================================
  // Sanitization
  // ============================================
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // ============================================
  // Generate UUID
  // ============================================
  
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// Export globally
window.Utils = Utils;