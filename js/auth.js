/* ============================================
   ARE YOU DELULU - Authentication
   ============================================ */

const Auth = {
  currentUser: null,
  currentProfile: null,
  isInitialized: false,
  
  // ============================================
  // Initialize Auth State
  // ============================================
  
  async init() {
    console.log('[Auth] init() called');
    
    // Prevent double init
    if (this.isInitialized) {
      console.log('[Auth] Already initialized');
      return this.currentUser;
    }
    
    // Check for existing session
    const { data: { session }, error: sessionError } = await db.auth.getSession();
    console.log('[Auth] getSession result:', session ? 'found' : 'none');
    
    if (session) {
      this.currentUser = session.user;
      await this.loadProfile();
    }
    
    // Listen for sign out only
    db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
        window.location.reload();
      }
    });
    
    this.isInitialized = true;
    console.log('[Auth] init() complete');
    return this.currentUser;
  },
  
  // ============================================
  // Load User Profile
  // ============================================
  
  async loadProfile() {
    console.log('[Auth] loadProfile() called, currentUser:', this.currentUser?.id);
    
    if (!this.currentUser) {
      console.log('[Auth] loadProfile() - no currentUser, returning null');
      return null;
    }
    
    console.log('[Auth] Fetching profile from database...');
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', this.currentUser.id)
      .single();
    
    console.log('[Auth] Profile fetch result:', { data, error });
    
    if (error) {
      console.error('[Auth] Error loading profile:', error);
      return null;
    }
    
    this.currentProfile = data;
    console.log('[Auth] Profile loaded:', this.currentProfile);
    return data;
  },
  
  // ============================================
  // Sign Up
  // ============================================
  
  async signUp(email, password, name, dateOfBirth) {
    // Validate age
    if (!Utils.isAdult(dateOfBirth)) {
      return {
        error: {
          message: 'age_restriction'
        }
      };
    }
    
    // Sign up with Supabase Auth
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          date_of_birth: dateOfBirth
        }
      }
    });
    
    if (error) {
      return { error };
    }
    
    // The trigger will create the profile row
    this.currentUser = data.user;
    
    // Wait a moment for the trigger to complete, then load profile
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.loadProfile();
    
    return { data };
  },
  
  // ============================================
  // Sign In
  // ============================================
  
  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { error };
    }
    
    this.currentUser = data.user;
    await this.loadProfile();
    
    return { data };
  },
  
  // ============================================
  // Sign Out
  // ============================================
  
  async signOut() {
    const { error } = await db.auth.signOut();
    
    if (error) {
      return { error };
    }
    
    this.currentUser = null;
    this.currentProfile = null;
    
    return { success: true };
  },
  
  // ============================================
  // Check if Logged In
  // ============================================
  
  isLoggedIn() {
    return !!this.currentUser;
  },
  
  // ============================================
  // Get Current User Data
  // ============================================
  
  getUser() {
    return this.currentUser;
  },
  
  getProfile() {
    return this.currentProfile;
  },
  
  // ============================================
  // Update Profile
  // ============================================
  
  async updateProfile(updates) {
    if (!this.currentUser) return { error: 'Not logged in' };
    
    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('id', this.currentUser.id)
      .select()
      .single();
    
    if (error) {
      return { error };
    }
    
    this.currentProfile = data;
    return { data };
  },
  
  // ============================================
  // Delete Account
  // ============================================
  
  async deleteAccount() {
    if (!this.currentUser) return { error: 'Not logged in' };
    
    // Delete from users table (cascades to guys, pro_cons, chats)
    const { error: deleteError } = await db
      .from('users')
      .delete()
      .eq('id', this.currentUser.id);
    
    if (deleteError) {
      return { error: deleteError };
    }
    
    // Sign out
    await this.signOut();
    
    return { success: true };
  },
  
  // ============================================
  // Password Reset
  // ============================================
  
  async resetPassword(email) {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/reset-password'
    });
    
    if (error) {
      return { error };
    }
    
    return { success: true };
  }
};

// Export globally
window.Auth = Auth;