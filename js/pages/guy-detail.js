/* ============================================
   ARE YOU DELULU - Guy Detail Page
   ============================================ */

const GuyDetail = {
  currentGuy: null,
  currentProCons: [],
  
  async render(guyId) {
    console.log('[GuyDetail] render() called, guyId:', guyId);
    
    const renderId = App.getRenderId();
    
    App.renderShell(`
      <div class="page-loader">
        <div class="spinner"></div>
      </div>
    `, { showBack: true });
    
    try {
      // Fetch guy
      console.log('[GuyDetail] Fetching guy from database...');
      const { data: guy, error: guyError } = await db
        .from('guys')
        .select('*')
        .eq('id', guyId)
        .single();
      
      // Check if we navigated away
      if (!App.shouldRender(renderId)) {
        console.log('[GuyDetail] Stale render, aborting');
        return;
      }
      
      console.log('[GuyDetail] Guy fetch result:', { guy, guyError });
      
      if (guyError || !guy) {
        Utils.showToast('Ragazzo non trovato', 'error');
        window.location.hash = '#/dashboard';
        return;
      }
      
      this.currentGuy = guy;
      
      // Fetch pro_cons
      console.log('[GuyDetail] Fetching pro_cons...');
      const { data: proCons, error: pcError } = await db
        .from('pro_cons')
        .select('*')
        .eq('guy_id', guyId)
        .order('position', { ascending: true });
      
      console.log('[GuyDetail] Pro_cons fetch result:', { proCons, pcError });
      
      // Check again after second fetch
      if (!App.shouldRender(renderId)) {
        console.log('[GuyDetail] Stale render, aborting');
        return;
      }
      
      this.currentProCons = proCons || [];

      // Decrypt pro_cons text
      if (this.currentProCons.length > 0) {
        await Utils.decryptProCons(this.currentProCons);
      }

      const pros = this.currentProCons.filter(p => p.type === 'pro');
      const cons = this.currentProCons.filter(p => p.type === 'con');
      const hasProCons = pros.length > 0 || cons.length > 0;

      const content = `
        <div class="guy-detail-header">
          <div class="guy-detail-title">
            <h1 class="page-title">${Utils.escapeHtml(guy.name)}</h1>
            ${guy.how_met ? `<span class="badge badge-secondary">${Utils.getHowMetLabel(guy.how_met)}</span>` : ''}
          </div>
          <div class="guy-detail-actions">
            <button class="btn btn-ghost" onclick="GuyDetail.deleteGuy('${guyId}')" title="Elimina">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        ${hasProCons ? `
          <div class="verdict-cta">
            <button class="btn btn-verdict" onclick="GuyDetail.showVerdict('${guyId}', '${Utils.escapeHtml(guy.name).replace(/'/g, "\\'")}')">
              <span class="verdict-cta-emoji">🔮</span>
              <span>Rivela il verdetto su ${Utils.escapeHtml(guy.name)}</span>
            </button>
          </div>
        ` : `
          <div class="verdict-cta verdict-cta-disabled">
            <div class="verdict-cta-hint">
              <span>✨</span>
              <span>Aggiungi almeno un pro o contro per sbloccare il verdetto</span>
            </div>
          </div>
        `}
        
        <div class="procon-columns">
          <div class="procon-column">
            <div class="procon-column-header pro">PRO (${pros.length})</div>
            <div class="procon-list" id="pros-list">
              ${pros.map(p => this.renderProConItem(p, guyId)).join('')}
              ${pros.length === 0 ? '<p class="text-secondary text-sm text-center">Nessun pro ancora</p>' : ''}
            </div>
            <div class="procon-add">
              <input type="text" class="procon-add-input" id="add-pro-input" placeholder="Aggiungi un pro..." data-type="pro" data-guy="${guyId}" autocomplete="off">
              <button class="procon-add-btn" onclick="GuyDetail.submitInput('add-pro-input')" title="Aggiungi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="procon-column">
            <div class="procon-column-header con">CONTRO (${cons.length})</div>
            <div class="procon-list" id="cons-list">
              ${cons.map(c => this.renderProConItem(c, guyId)).join('')}
              ${cons.length === 0 ? '<p class="text-secondary text-sm text-center">Nessun contro ancora</p>' : ''}
            </div>
            <div class="procon-add">
              <input type="text" class="procon-add-input" id="add-con-input" placeholder="Aggiungi un contro..." data-type="con" data-guy="${guyId}" autocomplete="off">
              <button class="procon-add-btn" onclick="GuyDetail.submitInput('add-con-input')" title="Aggiungi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
      
      App.renderShell(content, { showBack: true });
      this.bindEvents(guyId, pros, cons);
      
    } catch (err) {
      console.error('[GuyDetail] EXCEPTION:', err);
      Utils.showToast('Errore: ' + err.message, 'error');
    }
  },
  
  renderProConItem(item, guyId) {
    const weightLabel = Utils.getWeightLabel(item.type, item.weight);
    const weightOptions = item.type === 'pro' 
      ? [
          { value: 1, label: 'Meh ok' },
          { value: 3, label: 'Sì dai' },
          { value: 5, label: 'QUESTO SÌ' }
        ]
      : [
          { value: 1, label: 'Sopravvivo' },
          { value: 3, label: 'Non mi piace' },
          { value: 5, label: 'No proprio no' }
        ];
    
    const dealbreaker = item.type === 'con' ? `
      <button class="procon-item-dealbreaker ${item.is_dealbreaker ? 'active' : ''}" 
              onclick="GuyDetail.toggleDealbreaker('${item.id}', '${guyId}', ${!item.is_dealbreaker})"
              title="${item.is_dealbreaker ? 'Rimuovi dealbreaker' : 'Segna come dealbreaker'}">
        ⚠️
      </button>
    ` : '';
    
    return `
      <div class="procon-item" data-id="${item.id}">
        <span class="procon-item-text">${Utils.escapeHtml(item.text)}</span>
        <select class="procon-item-weight-select" onchange="GuyDetail.updateWeight('${item.id}', '${guyId}', this.value)">
          ${weightOptions.map(opt => `
            <option value="${opt.value}" ${item.weight === opt.value ? 'selected' : ''}>${opt.label}</option>
          `).join('')}
        </select>
        ${dealbreaker}
        <button class="btn btn-ghost btn-sm procon-item-delete" onclick="GuyDetail.deleteProCon('${item.id}', '${guyId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
  },
  
  bindEvents(guyId, pros, cons) {
    document.querySelectorAll('.procon-add-input').forEach(input => {
      let debounceTimer = null;
      
      // Autocomplete on input
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const text = input.value.trim();
        
        if (text.length < 2) {
          this.hideAutocomplete(input);
          return;
        }
        
        debounceTimer = setTimeout(() => {
          this.fetchAutocomplete(input, text, input.dataset.type, guyId);
        }, 300);
      });
      
      // Submit on Enter
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          this.hideAutocomplete(input);

          const type = input.dataset.type;
          const text = input.value.trim();

          // Get current count for position
          const currentList = type === 'pro' ? pros : cons;
          const position = currentList.length;

          input.disabled = true;

          try {
            // Encrypt the text before storing
            const encryptedText = await Utils.encryptText(text);

            const { error } = await db
              .from('pro_cons')
              .insert({
                guy_id: guyId,
                type,
                text: encryptedText,
                weight: 3,
                position
              });

            if (error) {
              Utils.showToast('Errore nel salvataggio', 'error');
              input.disabled = false;
              return;
            }

            // Reload page
            this.render(guyId);
          } catch (err) {
            Utils.showToast('Errore nella crittografia', 'error');
            input.disabled = false;
          }
        }
      });
      
      // Hide autocomplete on blur (with delay for click)
      input.addEventListener('blur', () => {
        setTimeout(() => this.hideAutocomplete(input), 200);
      });
    });
  },
  
  async fetchAutocomplete(input, searchTerm, type, guyId) {
    const userId = Auth.getUser()?.id;
    if (!userId) return;

    const { data, error } = await db.rpc('get_autocomplete', {
      user_uuid: userId,
      search_term: searchTerm,
      entry_type: type,
      exclude_guy_id: guyId
    });

    if (error || !data || data.length === 0) {
      this.hideAutocomplete(input);
      return;
    }

    // Decrypt the autocomplete suggestions
    if (data.length > 0) {
      const texts = data.map(s => s.text);
      const decryptedTexts = await Utils.decryptTexts(texts);
      data.forEach((s, i) => {
        s.text = decryptedTexts[i];
      });

      // Filter suggestions that match the search term (after decryption)
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = data.filter(s => s.text.toLowerCase().includes(lowerSearch));

      if (filtered.length === 0) {
        this.hideAutocomplete(input);
        return;
      }

      this.showAutocomplete(input, filtered, guyId);
    }
  },
  
  showAutocomplete(input, suggestions, guyId) {
    // Remove existing dropdown
    this.hideAutocomplete(input);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.id = 'autocomplete-dropdown';
    dropdown.innerHTML = suggestions.map(s => `
      <div class="autocomplete-item" data-text="${Utils.escapeHtml(s.text)}">
        <span>${Utils.escapeHtml(s.text)}</span>
        <span class="autocomplete-count">usato ${s.times_used}x</span>
      </div>
    `).join('');
    
    // Position using fixed positioning (avoids overflow:hidden clipping)
    const inputRect = input.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (inputRect.bottom + 4) + 'px';
    dropdown.style.left = inputRect.left + 'px';
    dropdown.style.width = inputRect.width + 'px';
    dropdown.style.zIndex = '9999';
    
    document.body.appendChild(dropdown);
    
    // Handle click on suggestion
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', async (e) => {
        e.preventDefault();
        const text = item.dataset.text;
        input.value = text;
        this.hideAutocomplete(input);

        // Auto-submit
        const type = input.dataset.type;
        const currentList = this.currentProCons.filter(p => p.type === type);
        const position = currentList.length;

        input.disabled = true;

        try {
          // Encrypt the text before storing
          const encryptedText = await Utils.encryptText(text);

          const { error } = await db
            .from('pro_cons')
            .insert({
              guy_id: guyId,
              type,
              text: encryptedText,
              weight: 3,
              position
            });

          if (error) {
            Utils.showToast('Errore nel salvataggio', 'error');
            input.disabled = false;
            return;
          }

          this.render(guyId);
        } catch (err) {
          Utils.showToast('Errore nella crittografia', 'error');
          input.disabled = false;
        }
      });
    });
  },
  
  hideAutocomplete(input) {
    const existing = document.getElementById('autocomplete-dropdown');
    if (existing) existing.remove();
  },
  
  async deleteGuy(guyId) {
    if (!confirm('Sei sicura di voler eliminare questo ragazzo? Tutti i dati verranno persi.')) {
      return;
    }
    
    const { error } = await db
      .from('guys')
      .delete()
      .eq('id', guyId);
    
    if (error) {
      Utils.showToast('Errore durante l\'eliminazione', 'error');
      return;
    }
    
    Utils.showToast('Ragazzo eliminato', 'success');
    window.location.hash = '#/dashboard';
  },
  
  async deleteProCon(proConId, guyId) {
    const { error } = await db
      .from('pro_cons')
      .delete()
      .eq('id', proConId);
    
    if (error) {
      Utils.showToast('Errore durante l\'eliminazione', 'error');
      return;
    }
    
    // Reload page
    this.render(guyId);
  },
  
  // Submit input when clicking the + button
  async submitInput(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) return;

    const type = input.dataset.type;
    const guyId = input.dataset.guy;
    const text = input.value.trim();

    // Get current count for position
    const currentList = this.currentProCons.filter(p => p.type === type);
    const position = currentList.length;

    input.disabled = true;

    try {
      // Encrypt the text before storing
      const encryptedText = await Utils.encryptText(text);

      const { error } = await db
        .from('pro_cons')
        .insert({
          guy_id: guyId,
          type,
          text: encryptedText,
          weight: 3,
          position
        });

      if (error) {
        Utils.showToast('Errore nel salvataggio', 'error');
        input.disabled = false;
        return;
      }

      // Reload page
      this.render(guyId);
    } catch (err) {
      Utils.showToast('Errore nella crittografia', 'error');
      input.disabled = false;
    }
  },
  
  // Update weight when dropdown changes
  async updateWeight(itemId, guyId, newWeight) {
    const { error } = await db
      .from('pro_cons')
      .update({ weight: parseInt(newWeight) })
      .eq('id', itemId);
    
    if (error) {
      Utils.showToast('Errore nell\'aggiornamento', 'error');
      return;
    }
    
    // Reload to update score
    this.render(guyId);
  },
  
  // Toggle dealbreaker status
  async toggleDealbreaker(itemId, guyId, newValue) {
    const { error } = await db
      .from('pro_cons')
      .update({ is_dealbreaker: newValue })
      .eq('id', itemId);

    if (error) {
      Utils.showToast('Errore nell\'aggiornamento', 'error');
      return;
    }

    // Reload to update score
    this.render(guyId);
  },

  // Show verdict with loading animation
  showVerdict(guyId, guyName) {
    const score = Utils.calculateScore(this.currentProCons);
    const category = Utils.getScoreCategory(score.percentage, score.hasDealbreaker);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'verdict-modal';
    modal.className = 'modal-backdrop active verdict-modal-backdrop';

    // Loading texts (Gen-Z style)
    const loadingTexts = [
      'Consultando le stelle... ✨',
      'Analizzando le red flag... 🚩',
      'Chiamando la tua bestie... 📱',
      'Chiedendo a Marte se è retrogrado... 🪐',
      'Scrollando il suo profilo... 👀',
      'Facendo i conti della serva... 🧮',
      'Consultando il tarocco dell\'amore... 🃏',
      'Aspettando che risponda... ⏳',
      'Decodificando i suoi messaggi... 🔍',
      'Stalkerando il suo Instagram... 📸',
      'Chiedendo conferma al tuo sesto senso... 🔮',
      'Elaborando la matematica del cuore... 💔'
    ];

    modal.innerHTML = `
      <div class="verdict-modal">
        <div class="verdict-loading" id="verdict-loading">
          <div class="verdict-loading-emoji">🔮</div>
          <div class="verdict-loading-text" id="loading-text">${loadingTexts[0]}</div>
          <div class="verdict-loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="verdict-result" id="verdict-result" style="display: none;">
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Animate loading texts
    let textIndex = 0;
    const loadingTextEl = document.getElementById('loading-text');
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      loadingTextEl.style.opacity = 0;
      setTimeout(() => {
        loadingTextEl.textContent = loadingTexts[textIndex];
        loadingTextEl.style.opacity = 1;
      }, 200);
    }, 1200);

    // Show result after random delay (2-4 seconds)
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      clearInterval(textInterval);
      this.renderVerdictResult(guyId, guyName, score, category);
    }, delay);
  },

  renderVerdictResult(guyId, guyName, score, category) {
    const loadingEl = document.getElementById('verdict-loading');
    const resultEl = document.getElementById('verdict-result');

    if (!loadingEl || !resultEl) return;

    // Get verdict text based on category and percentage
    const verdictText = Utils.getVerdictText(score.percentage, score.hasDealbreaker);
    const verdictEmoji = Utils.getVerdictEmoji(category, score.hasDealbreaker);

    // Calculate scale tilt (-50 to 50, negative = more cons)
    const scaleTilt = score.proTotal - score.conTotal;
    const tiltDegrees = Math.max(-25, Math.min(25, scaleTilt * 2));

    resultEl.innerHTML = `
      <button class="verdict-close" onclick="GuyDetail.closeVerdict()">✕</button>

      <div class="verdict-header">
        <div class="verdict-emoji">${verdictEmoji}</div>
        <h2 class="verdict-name">${Utils.escapeHtml(guyName)}</h2>
      </div>

      ${score.hasDealbreaker ? `
        <div class="verdict-dealbreaker">
          <span class="verdict-dealbreaker-icon">⚠️</span>
          <span class="verdict-dealbreaker-text">DEALBREAKER</span>
        </div>
      ` : `
        <div class="verdict-percentage text-${category}">${score.percentage}%</div>
      `}

      <div class="verdict-text">${verdictText}</div>

      <div class="verdict-scale">
        <div class="scale-container">
          <div class="scale-beam" style="transform: rotate(${tiltDegrees}deg)">
            <div class="scale-pan scale-pan-pro">
              <span class="scale-pan-label">PRO</span>
              <span class="scale-pan-count">${score.proCount}</span>
            </div>
            <div class="scale-fulcrum"></div>
            <div class="scale-pan scale-pan-con">
              <span class="scale-pan-label">CONTRO</span>
              <span class="scale-pan-count">${score.conCount}</span>
            </div>
          </div>
        </div>
        <div class="scale-weights">
          <span class="scale-weight-pro">💚 ${score.proTotal} punti</span>
          <span class="scale-weight-con">🚩 ${score.conTotal} punti</span>
        </div>
      </div>

      <div class="verdict-share">
        <p class="verdict-share-label">Condividi con le amiche</p>
        <div class="verdict-share-buttons">
          <button class="btn btn-share btn-share-wa" onclick="GuyDetail.shareVerdict('whatsapp', '${Utils.escapeHtml(guyName).replace(/'/g, "\\'")}', ${score.percentage}, ${score.hasDealbreaker})">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button class="btn btn-share btn-share-ig" onclick="GuyDetail.shareVerdict('instagram', '${Utils.escapeHtml(guyName).replace(/'/g, "\\'")}', ${score.percentage}, ${score.hasDealbreaker})">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Storia IG
          </button>
          <button class="btn btn-share btn-share-copy" onclick="GuyDetail.shareVerdict('copy', '${Utils.escapeHtml(guyName).replace(/'/g, "\\'")}', ${score.percentage}, ${score.hasDealbreaker})">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copia
          </button>
        </div>
      </div>

      <button class="btn btn-secondary btn-block mt-lg" onclick="GuyDetail.closeVerdict()">
        Torna ai pro e contro
      </button>
    `;

    // Animate transition
    loadingEl.style.opacity = 0;
    setTimeout(() => {
      loadingEl.style.display = 'none';
      resultEl.style.display = 'block';
      setTimeout(() => {
        resultEl.style.opacity = 1;
      }, 50);
    }, 300);
  },

  closeVerdict() {
    const modal = document.getElementById('verdict-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  },

  shareVerdict(platform, guyName, percentage, hasDealbreaker) {
    const verdict = hasDealbreaker ? 'DEALBREAKER ⚠️' : `${percentage}%`;
    const emoji = hasDealbreaker ? '🚩' : (percentage > 65 ? '💚' : percentage > 35 ? '🤔' : '🚩');
    const text = `${emoji} Il mio verdetto su ${guyName}: ${verdict}\n\nScopri se sei delulu anche tu!\nareyoudelulu.app`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't have a direct share API, copy to clipboard instead
        navigator.clipboard.writeText(text).then(() => {
          Utils.showToast('Testo copiato! Incollalo nella tua storia IG', 'success');
        });
        break;
      case 'copy':
        navigator.clipboard.writeText(text).then(() => {
          Utils.showToast('Copiato negli appunti!', 'success');
        });
        break;
    }
  }
};

window.GuyDetail = GuyDetail;
