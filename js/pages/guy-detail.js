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

  closeVerdict() {
    const modal = document.getElementById('verdict-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  },

  async shareVerdict(platform, guyName, percentage, hasDealbreaker) {
    const verdict = hasDealbreaker ? 'DEALBREAKER ⚠️' : `${percentage}%`;
    const emoji = hasDealbreaker ? '🚩' : (percentage > 65 ? '💚' : percentage > 35 ? '🤔' : '🚩');
    const text = `${emoji} Il mio verdetto su ${guyName}: ${verdict}`;
    const url = 'https://areyoudelulu.app';

    const shareData = {
      title: 'Are You Delulu?',
      text: text,
      url: url
    };

    // Use native Web Share API if available
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        Utils.showToast('Condiviso!', 'success');
      } catch (err) {
        // User cancelled or share failed
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          this.fallbackShare(text, url);
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      this.fallbackShare(text, url);
    }
  },

  fallbackShare(text, url) {
    const fullText = `${text}\n\nScopri se sei delulu anche tu!\n${url}`;
    navigator.clipboard.writeText(fullText).then(() => {
      Utils.showToast('Copiato negli appunti!', 'success');
    }).catch(() => {
      Utils.showToast('Impossibile copiare', 'error');
    });
  }
};

window.GuyDetail = GuyDetail;
