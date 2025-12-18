/* ============================================
   ARE YOU DELULU - Add Guy Page
   ============================================ */

const AddGuy = {
  render() {
    console.log('[AddGuy] render() called');
    
    const content = `
      <div class="add-guy-page">
        <div class="page-header">
          <h1 class="page-title">Aggiungi un ragazzo</h1>
          <p class="page-subtitle">Chi stiamo analizzando oggi?</p>
        </div>
        
        <form class="add-guy-form" id="add-guy-form">
          <div class="form-group">
            <label class="form-label" for="guy-name">Nome</label>
            <input type="text" id="guy-name" class="form-input" placeholder="Come si chiama?" required>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="how-met">Come vi siete conosciuti?</label>
            <select id="how-met" class="form-input form-select">
              <option value="">Seleziona...</option>
              <option value="app">App di dating</option>
              <option value="school">Scuola / Università</option>
              <option value="work">Lavoro</option>
              <option value="friends">Amici in comune</option>
              <option value="gym">Palestra</option>
              <option value="other">Altro</option>
            </select>
          </div>
          
          <div id="form-error" class="form-error hidden"></div>
          
          <div class="flex gap-md">
            <a href="#/dashboard" class="btn btn-secondary">Annulla</a>
            <button type="submit" class="btn btn-primary" style="flex:1">Aggiungi</button>
          </div>
        </form>
      </div>
    `;
    
    App.renderShell(content, { showBack: true });
    this.bindEvents();
  },
  
  bindEvents() {
    document.getElementById('add-guy-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('guy-name').value.trim();
      const howMet = document.getElementById('how-met').value || null;
      const errorDiv = document.getElementById('form-error');
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      if (!name) {
        errorDiv.textContent = 'Inserisci un nome';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      // Show loading
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
      
      const { data, error } = await db
        .from('guys')
        .insert({
          user_id: Auth.getUser().id,
          name,
          how_met: howMet
        })
        .select()
        .single();
      
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      
      if (error) {
        console.error('[AddGuy] Error adding guy:', error);
        errorDiv.textContent = 'Errore durante il salvataggio';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      Utils.showToast('Ragazzo aggiunto!', 'success');
      window.location.hash = `#/guy/${data.id}`;
    });
  }
};

window.AddGuy = AddGuy;