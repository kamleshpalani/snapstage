import Stripe from "stripe";

// Lazy initialization — avoids crash on boot if env var is missing
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });
  }
  return _stripe;
}

export const STRIPE_PRICES = {
  pro_monthly: "price_pro_monthly", // Replace with actual Stripe price ID
  agency_monthly: "price_agency_monthly",
  credits_10: "price_credits_10",
  credits_25: "price_credits_25",
};

export const PLAN_CREDITS: Record<string, number> = {
  free: 3,
  pro: 50,
  agency: 999999, // Unlimited
};
