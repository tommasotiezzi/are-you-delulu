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
            <button class="verdict-info-btn" onclick="GuyDetail.showVerdictInfo()" title="Come funziona?">?</button>
          </div>
        ` : `
          <div class="verdict-cta verdict-cta-disabled">
            <div class="verdict-cta-hint">
              <span>✨</span>
              <span>Aggiungi almeno un pro o contro per sbloccare il verdetto</span>
            </div>
            <button class="verdict-info-btn" onclick="GuyDetail.showVerdictInfo()" title="Come funziona?">?</button>
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
        }, 200);
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
    dropdown.innerHTML = `
      <div class="autocomplete-hint">
        <span>💡</span>
        <span>Riusa i tuoi attributi preferiti</span>
      </div>
      ${suggestions.map(s => `
        <div class="autocomplete-item" data-text="${Utils.escapeHtml(s.text)}">
          <span>${Utils.escapeHtml(s.text)}</span>
          <span class="autocomplete-count">usato ${s.times_used}x</span>
        </div>
      `).join('')}
    `;

    document.body.appendChild(dropdown);

    // Position the dropdown
    this.positionAutocomplete(input, dropdown);

    // Reposition on scroll or resize (for mobile keyboard)
    this.autocompleteRepositionHandler = () => this.positionAutocomplete(input, dropdown);
    window.addEventListener('scroll', this.autocompleteRepositionHandler, true);
    window.addEventListener('resize', this.autocompleteRepositionHandler);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.autocompleteRepositionHandler);
      window.visualViewport.addEventListener('scroll', this.autocompleteRepositionHandler);
    }

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

  positionAutocomplete(input, dropdown) {
    if (!dropdown || !input) return;

    const inputRect = input.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;

    // Get available viewport height (accounts for mobile keyboard)
    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;

    // Fixed position for all cases
    dropdown.style.position = 'fixed';
    dropdown.style.left = inputRect.left + 'px';
    dropdown.style.width = inputRect.width + 'px';
    dropdown.style.zIndex = '9999';

    if (isMobile) {
      // On mobile: position below input, limit height for keyboard
      const spaceBelow = viewportHeight - inputRect.bottom - 16;
      const maxHeight = Math.min(180, Math.max(100, spaceBelow - 8));
      dropdown.style.top = (inputRect.bottom + 4) + 'px';
      dropdown.style.bottom = 'auto';
      dropdown.style.maxHeight = maxHeight + 'px';
    } else {
      // On desktop: position ABOVE input for better visibility
      const dropdownHeight = Math.min(240, dropdown.scrollHeight);
      dropdown.style.top = (inputRect.top - dropdownHeight - 4) + 'px';
      dropdown.style.bottom = 'auto';
      dropdown.style.maxHeight = '240px';
    }
  },

  hideAutocomplete(input) {
    const existing = document.getElementById('autocomplete-dropdown');
    if (existing) existing.remove();

    // Remove event listeners
    if (this.autocompleteRepositionHandler) {
      window.removeEventListener('scroll', this.autocompleteRepositionHandler, true);
      window.removeEventListener('resize', this.autocompleteRepositionHandler);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this.autocompleteRepositionHandler);
        window.visualViewport.removeEventListener('scroll', this.autocompleteRepositionHandler);
      }
      this.autocompleteRepositionHandler = null;
    }
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

    // Get icon based on category
    const verdictIcon = this.getVerdictIcon(category, score.hasDealbreaker);

    // Calculate scale tilt based on weighted difference
    const weightDiff = score.proTotal - score.conTotal;
    const maxDiff = Math.max(score.proTotal, score.conTotal, 1);
    const tiltDegrees = Math.round((weightDiff / maxDiff) * 15); // Max 15 degrees tilt

    resultEl.innerHTML = `
      <button class="verdict-close" onclick="GuyDetail.closeVerdict()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="verdict-header">
        <div class="verdict-icon">${verdictIcon}</div>
        <h2 class="verdict-name">${Utils.escapeHtml(guyName)}</h2>
      </div>

      ${score.hasDealbreaker ? `
        <div class="verdict-dealbreaker">
          <svg class="verdict-dealbreaker-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span class="verdict-dealbreaker-text">DEALBREAKER</span>
        </div>
      ` : `
        <div class="verdict-percentage text-${category}">${score.percentage}%</div>
      `}

      <div class="verdict-text">${verdictText}</div>

      <div class="verdict-scale">
        <div class="scale-labels">
          <span class="scale-label-pro">PRO</span>
          <span class="scale-label-con">CONTRO</span>
        </div>
        <div class="scale-bar-container">
          <div class="scale-bar">
            <div class="scale-bar-pro" style="width: ${score.proTotal > 0 ? Math.round((score.proTotal / (score.proTotal + score.conTotal)) * 100) : 50}%"></div>
          </div>
          <div class="scale-indicator" style="left: ${score.proTotal > 0 ? Math.round((score.proTotal / (score.proTotal + score.conTotal)) * 100) : 50}%"></div>
        </div>
        <div class="scale-counts">
          <span class="scale-count-pro">${score.proCount} (${score.proTotal} pt)</span>
          <span class="scale-count-con">${score.conCount} (${score.conTotal} pt)</span>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm verdict-details-btn" onclick="GuyDetail.showVerdictDetails()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Vedi dettagli punteggio
      </button>

      <div class="verdict-share">
        <button class="btn btn-share-main" onclick="GuyDetail.shareVerdict('native', '${Utils.escapeHtml(guyName).replace(/'/g, "\\'")}', ${score.percentage}, ${score.hasDealbreaker})">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Condividi con le amiche
        </button>
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

  getVerdictIcon(category, hasDealbreaker) {
    if (hasDealbreaker) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4727A" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
    }

    const icons = {
      bruh: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4727A" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>`,
      ew: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E5A84B" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="15" x2="16" y2="15"></line>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>`,
      meh: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E5A84B" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="15" x2="16" y2="15"></line>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>`,
      ok: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7CB785" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>`,
      good: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7CB785" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>`,
      slay: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7CB785" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>`
    };

    return icons[category] || icons.meh;
  },

  showVerdictDetails() {
    const proCons = this.currentProCons;
    const pros = proCons.filter(p => p.type === 'pro');
    const cons = proCons.filter(p => p.type === 'con');

    const weightLabels = {
      pro: { 1: 'Meh ok', 3: 'Sì dai', 5: 'QUESTO SÌ' },
      con: { 1: 'Sopravvivo', 3: 'Non mi piace', 5: 'No proprio no' }
    };

    const modal = document.createElement('div');
    modal.id = 'verdict-details-modal';
    modal.className = 'modal-backdrop active';
    modal.onclick = (e) => {
      if (e.target === modal) this.closeVerdictDetails();
    };

    modal.innerHTML = `
      <div class="verdict-details-modal">
        <button class="verdict-details-close" onclick="GuyDetail.closeVerdictDetails()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h3 class="verdict-details-title">Dettagli punteggio</h3>

        <div class="verdict-details-section">
          <h4 class="verdict-details-section-title verdict-details-pro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Pro (${pros.length})
          </h4>
          ${pros.length > 0 ? `
            <ul class="verdict-details-list">
              ${pros.map(p => `
                <li class="verdict-details-item">
                  <span class="verdict-details-text">${Utils.escapeHtml(p.text)}</span>
                  <span class="verdict-details-weight verdict-details-weight-pro">+${p.weight} pt <span class="verdict-details-label">${weightLabels.pro[p.weight]}</span></span>
                </li>
              `).join('')}
            </ul>
          ` : '<p class="verdict-details-empty">Nessun pro</p>'}
        </div>

        <div class="verdict-details-section">
          <h4 class="verdict-details-section-title verdict-details-con">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Contro (${cons.length})
          </h4>
          ${cons.length > 0 ? `
            <ul class="verdict-details-list">
              ${cons.map(c => `
                <li class="verdict-details-item ${c.is_dealbreaker ? 'verdict-details-dealbreaker' : ''}">
                  <span class="verdict-details-text">${Utils.escapeHtml(c.text)} ${c.is_dealbreaker ? '<span class="dealbreaker-badge">DEALBREAKER</span>' : ''}</span>
                  <span class="verdict-details-weight verdict-details-weight-con">-${c.weight} pt <span class="verdict-details-label">${weightLabels.con[c.weight]}</span></span>
                </li>
              `).join('')}
            </ul>
          ` : '<p class="verdict-details-empty">Nessun contro</p>'}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  closeVerdictDetails() {
    const modal = document.getElementById('verdict-details-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  },

  closeVerdict() {
    const modal = document.getElementById('verdict-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  },

  showVerdictInfo() {
    const modal = document.createElement('div');
    modal.id = 'verdict-info-modal';
    modal.className = 'modal-backdrop active';
    modal.onclick = (e) => {
      if (e.target === modal) this.closeVerdictInfo();
    };

    modal.innerHTML = `
      <div class="verdict-info-modal">
        <button class="verdict-info-close" onclick="GuyDetail.closeVerdictInfo()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="verdict-info-header">
          <svg class="verdict-info-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <h2>Come funziona il verdetto?</h2>
        </div>

        <div class="verdict-info-content">
          <div class="verdict-info-section">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Il calcolo
            </h3>
            <p>Il verdetto bilancia i tuoi pro e contro, ma non tutti pesano allo stesso modo!</p>
          </div>

          <div class="verdict-info-section">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Il peso conta
            </h3>
            <p>Ogni pro o contro ha un <strong>peso</strong> che puoi scegliere dal menu a tendina:</p>

            <div class="verdict-info-weights-section">
              <p class="verdict-info-weights-label">Per i PRO:</p>
              <ul class="verdict-info-weights">
                <li><span class="weight-badge weight-low">Meh ok</span> = 1 punto</li>
                <li><span class="weight-badge weight-mid">Sì dai</span> = 3 punti</li>
                <li><span class="weight-badge weight-high">QUESTO SÌ</span> = 5 punti</li>
              </ul>
            </div>

            <div class="verdict-info-weights-section">
              <p class="verdict-info-weights-label">Per i CONTRO:</p>
              <ul class="verdict-info-weights">
                <li><span class="weight-badge weight-low">Sopravvivo</span> = 1 punto</li>
                <li><span class="weight-badge weight-mid">Non mi piace</span> = 3 punti</li>
                <li><span class="weight-badge weight-high">No proprio no</span> = 5 punti</li>
              </ul>
            </div>
          </div>

          <div class="verdict-info-section">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Dealbreaker
            </h3>
            <p>Se segni un contro come <strong>dealbreaker</strong>, il verdetto sarà automaticamente negativo. Alcune cose sono semplicemente inaccettabili!</p>
          </div>

          <div class="verdict-info-tip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Consiglio: scegli bene il peso di ogni pro e contro per un verdetto più accurato!</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  closeVerdictInfo() {
    const modal = document.getElementById('verdict-info-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  },

  async shareVerdict(platform, guyName, percentage, hasDealbreaker) {
    // Generate shareable image card
    const imageBlob = await this.generateShareCard(guyName, percentage, hasDealbreaker);

    const shareData = {
      title: 'Are You Delulu?',
      text: `Quanto è una red flag ${guyName}? Scoprilo su areyoudelulu.app`,
      files: [new File([imageBlob], 'verdetto.png', { type: 'image/png' })]
    };

    // Check if sharing files is supported
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        Utils.showToast('Condiviso!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fallback: try sharing without file
          this.fallbackShare(guyName, percentage, hasDealbreaker);
        }
      }
    } else {
      // Fallback for browsers without file sharing support
      this.fallbackShare(guyName, percentage, hasDealbreaker);
    }
  },

  async generateShareCard(guyName, percentage, hasDealbreaker) {
    const score = Utils.calculateScore(this.currentProCons);

    // Red flag percentage is inverted (100 - our score)
    const redFlagPercent = hasDealbreaker ? 100 : (100 - percentage);

    // Canvas setup
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 800;
    const dpr = 2; // High DPI for crisp images

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background gradient (lavender to peach)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#E8E0F0');
    gradient.addColorStop(1, '#FCE8E0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Card background
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 30, 30, width - 60, height - 60, 24);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 20;

    // Reset shadow for text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Header question
    ctx.fillStyle = '#6B5B7A';
    ctx.font = '600 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Quanto è una red flag da 1 a 100?', width / 2, 90);

    // Big red flag percentage
    const percentColor = redFlagPercent >= 70 ? '#D4727A' : redFlagPercent >= 40 ? '#E5A84B' : '#7CB785';
    ctx.fillStyle = percentColor;
    ctx.font = 'bold 120px Inter, system-ui, sans-serif';
    ctx.fillText(`${redFlagPercent}`, width / 2, 220);

    // "red flag" label
    ctx.fillStyle = '#6B5B7A';
    ctx.font = '500 24px Inter, system-ui, sans-serif';
    ctx.fillText(hasDealbreaker ? '🚨 DEALBREAKER 🚨' : '🚩 red flag', width / 2, 260);

    // Divider line
    ctx.strokeStyle = '#E8E0F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 300);
    ctx.lineTo(width - 60, 300);
    ctx.stroke();

    // Horizontal bar section
    const barY = 380;
    const barWidth = 400;
    const barHeight = 24;
    const barX = (width - barWidth) / 2;
    const totalPoints = score.proTotal + score.conTotal;
    const proPercent = totalPoints > 0 ? (score.proTotal / totalPoints) * 100 : 50;

    // Labels above bar
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7CB785';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText('PRO', barX, barY - 15);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#D4727A';
    ctx.fillText('CONTRO', barX + barWidth, barY - 15);

    // Bar background (con side - red)
    ctx.fillStyle = 'rgba(212, 114, 122, 0.3)';
    this.roundRect(ctx, barX, barY, barWidth, barHeight, 12);
    ctx.fill();

    // Pro bar (green overlay)
    if (proPercent > 0) {
      const proWidth = (barWidth * proPercent) / 100;
      ctx.fillStyle = '#7CB785';
      // Draw with rounded left corners only if less than full
      if (proPercent < 100) {
        ctx.beginPath();
        ctx.moveTo(barX + 12, barY);
        ctx.lineTo(barX + proWidth, barY);
        ctx.lineTo(barX + proWidth, barY + barHeight);
        ctx.lineTo(barX + 12, barY + barHeight);
        ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - 12);
        ctx.lineTo(barX, barY + 12);
        ctx.quadraticCurveTo(barX, barY, barX + 12, barY);
        ctx.closePath();
        ctx.fill();
      } else {
        this.roundRect(ctx, barX, barY, barWidth, barHeight, 12);
        ctx.fill();
      }
    }

    // Indicator triangle
    const indicatorX = barX + (barWidth * proPercent) / 100;
    ctx.fillStyle = '#4A3F5C';
    ctx.beginPath();
    ctx.moveTo(indicatorX, barY - 6);
    ctx.lineTo(indicatorX - 8, barY - 18);
    ctx.lineTo(indicatorX + 8, barY - 18);
    ctx.closePath();
    ctx.fill();

    // Counts below bar
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7CB785';
    ctx.font = '500 14px Inter, system-ui, sans-serif';
    ctx.fillText(`${score.proCount} (${score.proTotal} pt)`, barX, barY + barHeight + 25);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#D4727A';
    ctx.fillText(`${score.conCount} (${score.conTotal} pt)`, barX + barWidth, barY + barHeight + 25);

    ctx.textAlign = 'center';

    // Heavy pros/cons indicator
    const heavyPros = this.currentProCons.filter(p => p.type === 'pro' && p.weight === 5).length;
    const heavyCons = this.currentProCons.filter(p => p.type === 'con' && p.weight === 5).length;

    if (heavyPros > 0 || heavyCons > 0) {
      ctx.font = '400 16px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#8B7B9A';
      let heavyText = [];
      if (heavyPros > 0) heavyText.push(`${heavyPros} super pro`);
      if (heavyCons > 0) heavyText.push(`${heavyCons} red flag pesanti`);
      ctx.fillText(heavyText.join(' • '), width / 2, 475);
    }

    // Divider
    ctx.strokeStyle = '#E8E0F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 510);
    ctx.lineTo(width - 60, 510);
    ctx.stroke();

    // CTA section
    ctx.fillStyle = '#2D2D2D';
    ctx.font = '600 20px Inter, system-ui, sans-serif';
    ctx.fillText('Vuoi scoprire quanto sei delulu?', width / 2, 560);

    // App name/URL with lavender background
    ctx.fillStyle = '#C8B6DC';
    this.roundRect(ctx, 150, 585, width - 300, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#4A3F5C';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.fillText('areyoudelulu.app', width / 2, 618);

    // Footer emoji
    ctx.font = '32px Arial';
    ctx.fillText('💅', width / 2, 680);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  fallbackShare(guyName, percentage, hasDealbreaker) {
    const redFlagPercent = hasDealbreaker ? 100 : (100 - percentage);
    const fullText = `🚩 ${guyName} è una red flag al ${redFlagPercent}%!\n\nVuoi scoprire quanto sei delulu?\n👉 areyoudelulu.app`;
    navigator.clipboard.writeText(fullText).then(() => {
      Utils.showToast('Copiato negli appunti!', 'success');
    }).catch(() => {
      Utils.showToast('Impossibile copiare', 'error');
    });
  }
};

window.GuyDetail = GuyDetail;
