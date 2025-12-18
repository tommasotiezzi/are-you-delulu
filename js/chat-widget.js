/* ============================================
   ARE YOU DELULU - Floating Chat Widget (Bea)
   ============================================ */

const ChatWidget = {
  isOpen: false,
  currentGuyId: null,
  currentChatId: null,
  currentTone: null,
  messages: [],
  
  // Initialize widget
  init() {
    this.injectHTML();
    this.bindEvents();
  },
  
  // Inject floating button and chat panel HTML
  injectHTML() {
    const widget = document.createElement('div');
    widget.id = 'chat-widget';
    widget.innerHTML = `
      <!-- Floating Button -->
      <button class="chat-fab" id="chat-fab" title="Chatta con Bea">
        <span class="chat-fab-icon">💬</span>
        <span class="chat-fab-close">✕</span>
      </button>
      
      <!-- Chat Panel -->
      <div class="chat-panel" id="chat-panel">
        <div class="chat-panel-header">
          <div class="chat-panel-title">
            <span class="chat-avatar">🦋</span>
            <div>
              <strong>Bea</strong>
              <span class="chat-status">La tua bestie AI</span>
            </div>
          </div>
          <button class="chat-panel-close" id="chat-panel-close">✕</button>
        </div>
        
        <div class="chat-panel-body" id="chat-panel-body">
          <!-- Content injected dynamically -->
        </div>
      </div>
    `;
    document.body.appendChild(widget);
  },
  
  // Bind event listeners
  bindEvents() {
    document.getElementById('chat-fab').addEventListener('click', () => this.toggle());
    document.getElementById('chat-panel-close').addEventListener('click', () => this.close());
  },
  
  // Toggle chat panel
  toggle() {
    this.isOpen ? this.close() : this.open();
  },
  
  // Open chat panel
  open() {
    this.isOpen = true;
    document.getElementById('chat-widget').classList.add('open');
    
    // If we have a guy selected, show chat. Otherwise show guy selector
    if (this.currentGuyId) {
      this.showChat();
    } else {
      this.showGuySelector();
    }
  },
  
  // Close chat panel
  close() {
    this.isOpen = false;
    document.getElementById('chat-widget').classList.remove('open');
  },
  
  // Show guy selector
  async showGuySelector() {
    const body = document.getElementById('chat-panel-body');
    body.innerHTML = `<div class="chat-loading"><div class="spinner"></div></div>`;
    
    try {
      const { data: guys } = await db
        .from('guys')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (!guys || guys.length === 0) {
        body.innerHTML = `
          <div class="chat-empty">
            <p>Nessun ragazzo da analizzare!</p>
            <p class="text-sm text-secondary">Aggiungine uno dalla dashboard</p>
          </div>
        `;
        return;
      }
      
      body.innerHTML = `
        <div class="chat-guy-selector">
          <p class="chat-guy-selector-title">Di chi vuoi parlare?</p>
          <div class="chat-guy-list">
            ${guys.map(g => `
              <button class="chat-guy-item" data-guy-id="${g.id}" data-guy-name="${Utils.escapeHtml(g.name)}">
                <span class="chat-guy-name">${Utils.escapeHtml(g.name)}</span>
                <span class="chat-guy-arrow">→</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
      
      // Bind guy selection
      body.querySelectorAll('.chat-guy-item').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentGuyId = btn.dataset.guyId;
          this.currentGuyName = btn.dataset.guyName;
          this.showChatHistory();
        });
      });
      
    } catch (err) {
      body.innerHTML = `<div class="chat-empty"><p>Errore nel caricamento</p></div>`;
    }
  },
  
  // Show chat history for selected guy
  async showChatHistory() {
    const body = document.getElementById('chat-panel-body');
    body.innerHTML = `<div class="chat-loading"><div class="spinner"></div></div>`;
    
    try {
      // Fetch existing chats for this guy
      const { data: chats } = await db
        .from('chats')
        .select('*')
        .eq('guy_id', this.currentGuyId)
        .order('updated_at', { ascending: false });
      
      const toneEmojis = {
        sarcastic: '😏',
        brutal: '🔥',
        forgiving: '🤗'
      };
      
      body.innerHTML = `
        <div class="chat-history">
          <button class="chat-back-btn" id="chat-back-to-guys">← Cambia ragazzo</button>
          <p class="chat-history-title">Chat con <strong>${Utils.escapeHtml(this.currentGuyName)}</strong></p>
          
          <button class="chat-new-btn" id="chat-start-new">
            <span>+ Nuova chat</span>
          </button>
          
          ${chats && chats.length > 0 ? `
            <div class="chat-history-list">
              ${chats.map(chat => {
                const lastMsg = chat.messages && chat.messages.length > 0 
                  ? chat.messages[chat.messages.length - 1].content 
                  : 'Nessun messaggio';
                const preview = lastMsg.length > 40 ? lastMsg.substring(0, 40) + '...' : lastMsg;
                return `
                  <button class="chat-history-item" data-chat-id="${chat.id}">
                    <div class="chat-history-item-header">
                      <span class="chat-history-tone">${toneEmojis[chat.tone] || '💬'}</span>
                      <span class="chat-history-date">${Utils.formatRelativeTime(chat.updated_at)}</span>
                    </div>
                    <p class="chat-history-preview">${Utils.escapeHtml(preview)}</p>
                    <span class="chat-history-count">${chat.messages?.length || 0} messaggi</span>
                  </button>
                `;
              }).join('')}
            </div>
          ` : `
            <p class="chat-history-empty">Nessuna chat ancora. Iniziane una!</p>
          `}
        </div>
      `;
      
      // Bind back button
      document.getElementById('chat-back-to-guys').addEventListener('click', () => {
        this.currentGuyId = null;
        this.showGuySelector();
      });
      
      // Bind new chat button
      document.getElementById('chat-start-new').addEventListener('click', () => {
        this.showToneSelector();
      });
      
      // Bind existing chat items
      body.querySelectorAll('.chat-history-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          this.currentChatId = btn.dataset.chatId;
          this.messages = [];
          await this.showChat();
        });
      });
      
    } catch (err) {
      body.innerHTML = `<div class="chat-empty"><p>Errore nel caricamento</p></div>`;
    }
  },
  
  // Show tone selector
  showToneSelector() {
    const body = document.getElementById('chat-panel-body');
    const profile = Auth.getProfile();
    const canUseBrutal = Utils.canUseTone(profile, 'brutal');
    const canUseForgiving = Utils.canUseTone(profile, 'forgiving');
    
    body.innerHTML = `
      <div class="chat-tone-selector">
        <button class="chat-back-btn" id="chat-back-to-guys">← Cambia ragazzo</button>
        <p class="chat-tone-title">Come vuoi che ti parli di <strong>${Utils.escapeHtml(this.currentGuyName)}</strong>?</p>
        <div class="chat-tone-list">
          <button class="chat-tone-item" data-tone="sarcastic">
            <span class="chat-tone-emoji">😏</span>
            <div>
              <strong>Sarcastica</strong>
              <span>Ironica ma con affetto</span>
            </div>
          </button>
          <button class="chat-tone-item ${canUseBrutal ? '' : 'locked'}" data-tone="brutal">
            <span class="chat-tone-emoji">🔥</span>
            <div>
              <strong>Brutale</strong>
              <span>Onesta dopo 3 spritz</span>
            </div>
            ${canUseBrutal ? '' : '<span class="chat-tone-lock">🔒</span>'}
          </button>
          <button class="chat-tone-item ${canUseForgiving ? '' : 'locked'}" data-tone="forgiving">
            <span class="chat-tone-emoji">🤗</span>
            <div>
              <strong>Comprensiva</strong>
              <span>Trova il lato positivo</span>
            </div>
            ${canUseForgiving ? '' : '<span class="chat-tone-lock">🔒</span>'}
          </button>
        </div>
      </div>
    `;
    
    // Bind back button
    document.getElementById('chat-back-to-guys').addEventListener('click', () => {
      this.showChatHistory();
    });
    
    // Bind tone selection
    body.querySelectorAll('.chat-tone-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tone = btn.dataset.tone;
        
        if (btn.classList.contains('locked')) {
          Utils.showPremiumModal();
          return;
        }
        
        this.currentTone = tone;
        await this.startNewChat();
      });
    });
  },
  
  // Start a new chat
  async startNewChat() {
    const body = document.getElementById('chat-panel-body');
    body.innerHTML = `<div class="chat-loading"><div class="spinner"></div></div>`;
    
    try {
      // Create chat in database
      const { data: chat, error } = await db
        .from('chats')
        .insert({
          guy_id: this.currentGuyId,
          tone: this.currentTone,
          messages: []
        })
        .select()
        .single();
      
      if (error) throw error;
      
      this.currentChatId = chat.id;
      this.messages = [];
      this.showChat();
      
    } catch (err) {
      Utils.showToast('Errore nella creazione chat', 'error');
      this.showToneSelector();
    }
  },
  
  // Show chat interface
  async showChat() {
    const body = document.getElementById('chat-panel-body');
    
    // Load existing messages if we have a chat
    if (this.currentChatId && this.messages.length === 0) {
      body.innerHTML = `<div class="chat-loading"><div class="spinner"></div></div>`;
      
      const { data: chat } = await db
        .from('chats')
        .select('*')
        .eq('id', this.currentChatId)
        .single();
      
      if (chat) {
        this.messages = chat.messages || [];
        this.currentTone = chat.tone;
      }
    }
    
    const toneLabels = {
      sarcastic: '😏 Sarcastica',
      brutal: '🔥 Brutale',
      forgiving: '🤗 Comprensiva'
    };
    
    body.innerHTML = `
      <div class="chat-interface">
        <div class="chat-toolbar">
          <button class="chat-back-btn" id="chat-new">← Indietro</button>
          <span class="chat-current-tone">${toneLabels[this.currentTone] || ''}</span>
        </div>
        <div class="chat-messages" id="chat-messages">
          ${this.messages.length === 0 ? `
            <div class="chat-welcome">
              <p>Ciao! Sono Bea 🦋</p>
              <p>Dimmi cosa pensi di questo tipo...</p>
            </div>
          ` : this.messages.map(m => `
            <div class="chat-message ${m.role}">
              ${Utils.escapeHtml(m.content)}
            </div>
          `).join('')}
        </div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chat-input" placeholder="Scrivi un messaggio..." maxlength="500">
          <button class="chat-send-btn" id="chat-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    // Scroll to bottom
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    // Bind events
    document.getElementById('chat-new').addEventListener('click', () => {
      this.currentChatId = null;
      this.messages = [];
      this.showChatHistory();
    });
    
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    
    const sendMessage = () => {
      const text = input.value.trim();
      if (text) {
        this.sendMessage(text);
        input.value = '';
      }
    };
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Focus input
    input.focus();
  },
  
  // Send a message
  async sendMessage(text) {
    // Add user message to UI immediately
    this.messages.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
    this.renderMessages();
    
    // Show typing indicator
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.innerHTML += `<div class="chat-message assistant typing" id="typing-indicator">...</div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    // Disable input while waiting
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    
    try {
      // Call Bea API
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-bea`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          chatId: this.currentChatId,
          message: text,
          tone: this.currentTone,
          guyId: this.currentGuyId,
          userId: Auth.getUser()?.id
        })
      });
      
      const data = await response.json();
      
      // Remove typing indicator
      document.getElementById('typing-indicator')?.remove();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add AI response
      const aiMessage = { 
        role: 'assistant', 
        content: data.response, 
        timestamp: new Date().toISOString() 
      };
      this.messages.push(aiMessage);
      this.renderMessages();
      
      // Save to database
      await db
        .from('chats')
        .update({ 
          messages: this.messages,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentChatId);
      
      // Show safety notice if triggered
      if (data.isSafety) {
        Utils.showToast('💜 Risorse di supporto disponibili nelle impostazioni', 'info');
      }
      
    } catch (err) {
      document.getElementById('typing-indicator')?.remove();
      console.error('[ChatWidget] Error:', err);
      
      // Fallback response
      this.messages.push({ 
        role: 'assistant', 
        content: 'ops, qualcosa è andato storto. riprova!',
        timestamp: new Date().toISOString()
      });
      this.renderMessages();
      
      Utils.showToast('Errore nella risposta', 'error');
    } finally {
      // Re-enable input
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (input) input.focus();
    }
  },
  
  // Render messages
  renderMessages() {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    messagesEl.innerHTML = this.messages.map(m => `
      <div class="chat-message ${m.role}">
        ${Utils.escapeHtml(m.content)}
      </div>
    `).join('');
    
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },
  
  // Open chat for a specific guy (called from guy detail page)
  openForGuy(guyId, guyName) {
    this.currentGuyId = guyId;
    this.currentGuyName = guyName;
    this.currentChatId = null;
    this.messages = [];
    this.open();
    this.showChatHistory();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to let auth initialize first
  setTimeout(() => {
    if (Auth.isLoggedIn()) {
      ChatWidget.init();
    }
  }, 500);
});

// Re-init when user logs in
window.addEventListener('hashchange', () => {
  if (Auth.isLoggedIn() && !document.getElementById('chat-widget')) {
    ChatWidget.init();
  }
});

window.ChatWidget = ChatWidget;