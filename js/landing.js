/* ============================================
   ARE YOU DELULU - Landing Page
   ============================================ */

const Landing = {
  isLoginMode: true,
  
  // ============================================
  // Initialize Landing Page
  // ============================================
  
  init() {
    console.log('[Landing] init() called');
    this.render();
    this.bindEvents();
    console.log('[Landing] init() complete');
  },
  
  // ============================================
  // Render Landing Page
  // ============================================
  
  render() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="landing-page">
        <!-- Left Side - Branding & Features -->
        <div class="landing-left">
          <div class="landing-brand">
            <h1 class="landing-logo">Are You Delulu</h1>
            <p class="landing-tagline">Traccia i tuoi ragazzi. Calcola il punteggio. Scopri la verità.</p>
          </div>
          
          <div class="landing-features">
            <div class="landing-feature">
              <div class="landing-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div class="landing-feature-text">
                <h4>Pro & Contro</h4>
                <p>Lista tutto quello che ami e odi di lui</p>
              </div>
            </div>
            
            <div class="landing-feature">
              <div class="landing-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div class="landing-feature-text">
                <h4>Punteggio Automatico</h4>
                <p>La matematica non mente (quasi mai)</p>
              </div>
            </div>
            
            <div class="landing-feature">
              <div class="landing-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div class="landing-feature-text">
                <h4>AI Bestie</h4>
                <p>Una chatbot sarcastica che ti dice come stanno le cose</p>
              </div>
            </div>
          </div>
          
          <div class="landing-social-proof">
            <p class="landing-social-proof-title">Cosa dicono le utenti</p>
            <p class="landing-quote">"Ho finalmente mollato dopo aver visto 47% scritto nero su bianco lmao"</p>
            <p class="landing-quote-source">— Esempio illustrativo</p>
            <p class="landing-quote">"Il modo brutale mi ha detto quello che le mie amiche erano troppo gentili per dire"</p>
            <p class="landing-quote-source">— Esempio illustrativo</p>
          </div>
        </div>
        
        <!-- Right Side - Auth Form -->
        <div class="landing-right">
          <div class="auth-container">
            <div class="auth-header">
              <h2 class="auth-title" id="auth-title">Bentornata</h2>
              <p class="auth-subtitle" id="auth-subtitle">Accedi per continuare</p>
            </div>
            
            <form class="auth-form" id="auth-form">
              <!-- Login Fields -->
              <div class="form-group" id="login-fields">
                <div class="form-group">
                  <label class="form-label" for="email">Email</label>
                  <input type="email" id="email" class="form-input" placeholder="ciao@esempio.it" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="password">Password</label>
                  <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                </div>
              </div>
              
              <!-- Signup Only Fields (hidden by default) -->
              <div class="form-group hidden" id="signup-fields">
                <div class="form-group">
                  <label class="form-label" for="signup-email">Email</label>
                  <input type="email" id="signup-email" class="form-input" placeholder="ciao@esempio.it">
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="signup-password">Password</label>
                  <input type="password" id="signup-password" class="form-input" placeholder="••••••••" minlength="6">
                  <p class="form-hint">Minimo 6 caratteri</p>
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="name">Nome</label>
                  <input type="text" id="name" class="form-input" placeholder="Il tuo nome">
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="dob">Data di nascita</label>
                  <input type="date" id="dob" class="form-input">
                  <p class="form-hint">Devi avere 18+ anni</p>
                </div>
              </div>
              
              <div id="form-error" class="form-error hidden"></div>
              
              <button type="submit" class="btn btn-primary btn-block" id="auth-submit">
                Accedi
              </button>
            </form>
            
            <p class="auth-toggle">
              <span id="toggle-text">Non hai un account?</span>
              <a href="#" id="toggle-link">Registrati</a>
            </p>
            
            <p class="auth-legal">
              Continuando, accetti i nostri <a href="#/terms">Termini di Servizio</a> e la <a href="#/privacy">Privacy Policy</a>
            </p>
          </div>
          
          <!-- Age Restriction Message (hidden by default) -->
          <div class="auth-container hidden" id="age-restriction">
            <div class="age-restriction-message">
              <h3>⚠️ Accesso Negato</h3>
              <p>Are You Delulu è disponibile solo per chi ha 18+ anni.</p>
              <p class="mt-md text-secondary">Torna quando avrai sopravvissuto a qualche situationship in più 💅</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // ============================================
  // Bind Events
  // ============================================
  
  bindEvents() {
    const form = document.getElementById('auth-form');
    const toggleLink = document.getElementById('toggle-link');
    
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    toggleLink.addEventListener('click', (e) => this.toggleMode(e));
  },
  
  // ============================================
  // Toggle Login/Signup Mode
  // ============================================
  
  toggleMode(e) {
    e.preventDefault();
    this.isLoginMode = !this.isLoginMode;
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const submitBtn = document.getElementById('auth-submit');
    const loginFields = document.getElementById('login-fields');
    const signupFields = document.getElementById('signup-fields');
    const errorDiv = document.getElementById('form-error');
    
    // Clear error
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
    
    if (this.isLoginMode) {
      title.textContent = 'Bentornata';
      subtitle.textContent = 'Accedi per continuare';
      toggleText.textContent = 'Non hai un account?';
      toggleLink.textContent = 'Registrati';
      submitBtn.textContent = 'Accedi';
      loginFields.classList.remove('hidden');
      signupFields.classList.add('hidden');
    } else {
      title.textContent = 'Crea Account';
      subtitle.textContent = 'Inizia a tracciare i tuoi ragazzi';
      toggleText.textContent = 'Hai già un account?';
      toggleLink.textContent = 'Accedi';
      submitBtn.textContent = 'Registrati';
      loginFields.classList.add('hidden');
      signupFields.classList.remove('hidden');
    }
  },
  
  // ============================================
  // Handle Form Submit
  // ============================================
  
  async handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('auth-submit');
    const errorDiv = document.getElementById('form-error');
    
    // Clear previous error
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
    
    // Show loading
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    try {
      if (this.isLoginMode) {
        await this.handleLogin();
      } else {
        await this.handleSignup();
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showError('Si è verificato un errore. Riprova.');
    } finally {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
    }
  },
  
  // ============================================
  // Handle Login
  // ============================================
  
  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      this.showError('Compila tutti i campi');
      return;
    }
    
    if (!Utils.validateEmail(email)) {
      this.showError('Email non valida');
      return;
    }
    
    const { error } = await Auth.signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        this.showError('Email o password non corretti');
      } else {
        this.showError('Errore durante l\'accesso. Riprova.');
      }
      return;
    }
    
    // Success - App will handle redirect
    App.handleAuthSuccess();
  },
  
  // ============================================
  // Handle Signup
  // ============================================
  
  async handleSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('name').value.trim();
    const dob = document.getElementById('dob').value;
    
    if (!email || !password || !name || !dob) {
      this.showError('Compila tutti i campi');
      return;
    }
    
    if (!Utils.validateEmail(email)) {
      this.showError('Email non valida');
      return;
    }
    
    if (!Utils.validatePassword(password)) {
      this.showError('La password deve avere almeno 6 caratteri');
      return;
    }
    
    const { error } = await Auth.signUp(email, password, name, dob);
    
    if (error) {
      if (error.message === 'age_restriction') {
        this.showAgeRestriction();
        return;
      }
      
      if (error.message.includes('already registered')) {
        this.showError('Questa email è già registrata');
      } else {
        this.showError('Errore durante la registrazione. Riprova.');
      }
      return;
    }
    
    // Success - App will handle redirect and disclaimer
    App.handleAuthSuccess(true);
  },
  
  // ============================================
  // Show Error
  // ============================================
  
  showError(message) {
    const errorDiv = document.getElementById('form-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  },
  
  // ============================================
  // Show Age Restriction
  // ============================================
  
  showAgeRestriction() {
    document.querySelector('.landing-right .auth-container:first-child').classList.add('hidden');
    document.getElementById('age-restriction').classList.remove('hidden');
  }
};

// Export globally
window.Landing = Landing;