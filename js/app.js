/* ============================================
   ARE YOU DELULU - Main Application
   ============================================ */

const App = {
  currentRoute: null,
  renderId: 0,
  
  // ============================================
  // Initialize Application
  // ============================================
  
  async init() {
    console.log('[App] init() called');
    
    // Initialize auth
    console.log('[App] Calling Auth.init()...');
    await Auth.init();
    console.log('[App] Auth.init() complete, isLoggedIn:', Auth.isLoggedIn());
    
    // Check auth state and route accordingly
    if (Auth.isLoggedIn()) {
      console.log('[App] User is logged in');
      // Check disclaimer
      if (!Utils.hasAcceptedDisclaimer()) {
        console.log('[App] Showing disclaimer');
        this.showDisclaimer();
      }
      console.log('[App] Calling handleRoute()');
      this.handleRoute();
    } else {
      console.log('[App] User is NOT logged in, showing landing');
      Landing.init();
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      console.log('[App] hashchange event, new hash:', window.location.hash);
      this.handleRoute();
    });
    
    console.log('[App] init() complete');
  },
  
  // ============================================
  // Handle Auth Success
  // ============================================
  
  handleAuthSuccess(isNewUser = false) {
    console.log('[App] handleAuthSuccess(), isNewUser:', isNewUser);
    if (isNewUser) {
      this.showDisclaimer();
    }
    window.location.hash = '#/dashboard';
    this.handleRoute();
  },
  
  // ============================================
  // Show Disclaimer Modal
  // ============================================
  
  showDisclaimer() {
    let modal = document.getElementById('disclaimer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'disclaimer-modal';
      modal.className = 'modal-backdrop active';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-body">
            <div class="disclaimer-content">
              <div class="disclaimer-icon">⚠️</div>
              <h3 class="mb-md">Un attimo!</h3>
              <p class="disclaimer-text">
                Are You Delulu è solo per intrattenimento. Siamo l'energia caotica della chat di gruppo, non una terapista o un'avvocata.
                <br><br>
                Se ti trovi in una situazione che non ti fa sentire al sicuro, parlane con qualcuno che può davvero aiutarti.
              </p>
              <button class="btn btn-primary btn-block" id="accept-disclaimer">
                Ho capito, continua
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      document.getElementById('accept-disclaimer').addEventListener('click', () => {
        Utils.acceptDisclaimer();
        modal.remove();
      });
    }
  },
  
  // ============================================
  // Route Handler
  // ============================================
  
  handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const [path, param] = this.parseRoute(hash);
    
    // Increment render ID to track stale renders
    this.renderId++;
    const currentRenderId = this.renderId;
    
    console.log('[App] handleRoute() - hash:', hash, 'path:', path, 'renderId:', currentRenderId);
    
    // If not logged in, show landing
    if (!Auth.isLoggedIn()) {
      console.log('[App] handleRoute() - not logged in, showing landing');
      Landing.init();
      return;
    }
    
    this.currentRoute = path;
    
    switch (path) {
      case '/dashboard':
        console.log('[App] Routing to dashboard');
        Dashboard.render();
        break;
      case '/add-guy':
        console.log('[App] Routing to add-guy');
        AddGuy.render();
        break;
      case '/guy':
        console.log('[App] Routing to guy detail:', param);
        GuyDetail.render(param);
        break;
      case '/settings':
        console.log('[App] Routing to settings');
        Settings.render();
        break;
      case '/patterns':
        console.log('[App] Routing to patterns');
        Patterns.render();
        break;
      case '/premium':
        console.log('[App] Routing to premium');
        Premium.render();
        break;
      default:
        console.log('[App] Unknown route, defaulting to dashboard');
        Dashboard.render();
    }
  },
  
  // ============================================
  // Parse Route
  // ============================================
  
  parseRoute(hash) {
    // Remove query params before parsing
    const hashWithoutQuery = hash.split('?')[0];
    const parts = hashWithoutQuery.slice(1).split('/').filter(Boolean);
    const path = '/' + (parts[0] || 'dashboard');
    const param = parts[1] || null;
    return [path, param];
  },
  
  // Check if a render should proceed (not stale)
  shouldRender(renderId) {
    return renderId === this.renderId;
  },
  
  // Get current render ID for async operations
  getRenderId() {
    return this.renderId;
  },
  
  // ============================================
  // Render App Shell
  // ============================================
  
  renderShell(content, options = {}) {
    console.log('[App] renderShell() called, renderId:', this.renderId);
    
    const app = document.getElementById('app');
    if (!app) {
      console.error('[App] renderShell() - app element not found!');
      return;
    }
    
    const profile = Auth.getProfile();
    const showBack = options.showBack || false;
    const backUrl = options.backUrl || '#/dashboard';
    
    app.innerHTML = `
      <div class="app-layout">
        <header class="app-header">
          <div class="app-header-inner">
            <div class="flex items-center gap-md">
              ${showBack ? `
                <a href="${backUrl}" class="btn btn-ghost btn-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </a>
              ` : ''}
              <a href="#/dashboard" class="app-logo">Are You Delulu</a>
            </div>
            <nav class="app-nav">
              <a href="#/settings" class="btn btn-ghost btn-sm" title="Impostazioni">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </a>
              <div class="avatar" title="${profile?.name || 'Utente'}">
                ${(profile?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </nav>
          </div>
        </header>
        <main class="app-main">
          <div class="app-main-inner">
            ${content}
          </div>
        </main>
      </div>
    `;
  }
};

// Export globally
window.App = App;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});