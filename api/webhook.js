// /api/webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Disable body parsing - we need raw body for webhook verification
module.exports.config = {
  api: {
    bodyParser: false
  }
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
  
  console.log('Webhook event:', event.type);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.supabase_user_id;
        const customerId = session.customer;
        
        if (userId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          // Update user to premium
          await supabase
            .from('users')
            .update({
              tier: 'premium',
              stripe_customer_id: customerId,
              premium_expires_at: currentPeriodEnd.toISOString()
            })
            .eq('id', userId);
          
          console.log(`User ${userId} upgraded to premium until ${currentPeriodEnd}`);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (user) {
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          
          await supabase
            .from('users')
            .update({
              tier: isActive ? 'premium' : 'free',
              premium_expires_at: isActive ? currentPeriodEnd.toISOString() : null
            })
            .eq('id', user.id);
          
          console.log(`User ${user.id} subscription updated: ${subscription.status}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find user and downgrade
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (user) {
          await supabase
            .from('users')
            .update({
              tier: 'free',
              premium_expires_at: null
            })
            .eq('id', user.id);
          
          console.log(`User ${user.id} subscription cancelled`);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        // Find user
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (user) {
          console.log(`Payment failed for user ${user.id}`);
          // Optionally: send email, show warning, etc.
        }
        break;
      }
    }
    
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};