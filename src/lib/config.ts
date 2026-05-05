// src/lib/config.ts

export const config = {
  stripe: {
    proPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
    enterprisePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ?? "",
  },
};