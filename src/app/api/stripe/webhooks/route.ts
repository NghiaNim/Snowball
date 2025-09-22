import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Create service role client for webhook operations
function createWebhookClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createServiceRoleClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createWebhookClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('❌ No user ID found in subscription metadata')
          return NextResponse.json({ error: 'No user ID found' }, { status: 400 })
        }

        // Upsert subscription record
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan_type: subscription.status === 'active' ? 'pro' : 'free',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (error) {
          console.error('❌ Error updating subscription:', error)
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
        }

        console.log('✅ Subscription updated for user:', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('❌ No user ID found in subscription metadata')
          return NextResponse.json({ error: 'No user ID found' }, { status: 400 })
        }

        // Update subscription to free plan
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_type: 'free',
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (error) {
          console.error('❌ Error canceling subscription:', error)
          return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
        }

        console.log('✅ Subscription canceled for user:', userId)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId || session.client_reference_id

        if (!userId) {
          console.error('❌ No user ID found in checkout session')
          return NextResponse.json({ error: 'No user ID found' }, { status: 400 })
        }

        // If this is a subscription checkout, the subscription events will handle the update
        // This event is mainly for tracking successful checkouts
        console.log('✅ Checkout completed for user:', userId)
        break
      }

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
