import { Router, Request, Response } from "express";
import { getStripe, STRIPE_PRICES, PLAN_CREDITS } from "../lib/stripe";
import { createClient } from "../lib/supabase";
import Stripe from "stripe";

export const paymentsRouter = Router();

// POST /payments/create-checkout — start Stripe checkout
paymentsRouter.post("/create-checkout", async (req: Request, res: Response) => {
  const { userId, plan, email, successUrl, cancelUrl } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ error: "Missing userId or plan" });
  }

  let priceId: string | null = null;
  if (plan === "pro") {
    priceId = STRIPE_PRICES.pro_monthly;
  } else if (plan === "agency") {
    priceId = STRIPE_PRICES.agency_monthly;
  }

  if (!priceId) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    success_url:
      successUrl || `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/dashboard/billing`,
  });

  return res.json({ url: session.url });
});

// POST /payments/webhook — Stripe webhooks
paymentsRouter.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[Stripe Webhook] Invalid signature:", err);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const supabase = createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { userId, plan } = session.metadata || {};

      if (userId && plan) {
        const credits = PLAN_CREDITS[plan] || 3;
        await supabase
          .from("profiles")
          .update({
            plan,
            credits_remaining: credits,
            stripe_customer_id: session.customer as string,
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      // Downgrade to free plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ plan: "free", credits_remaining: 3 })
          .eq("id", profile.id);
      }
      break;
    }
  }

  return res.json({ received: true });
});
