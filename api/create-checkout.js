// /api/create-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PRICES = {
  weekly: process.env.STRIPE_PRICE_WEEKLY,
  yearly: process.env.STRIPE_PRICE_YEARLY
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { plan, userId, userEmail } = req.body;
    
    if (!plan || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const priceId = PRICES[plan];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    // Check if user already has a Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    let customerId = user?.stripe_customer_id;
    
    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId }
      });
      customerId = customer.id;
      
      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'https://areyoudelulu.app'}/#/dashboard?success=true`,
      cancel_url: `${process.env.APP_URL || 'https://areyoudelulu.app'}/#/dashboard?cancelled=true`,
      metadata: {
        supabase_user_id: userId,
        plan: plan
      }
    });
    
    return res.status(200).json({ url: session.url });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
};