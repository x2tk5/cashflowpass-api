import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Data = { refund?: any; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Missing paymentIntentId" });
    }

    const params: any = { payment_intent: paymentIntentId };

    if (amount) {
      params.amount = Math.round(Number(amount) * 100);
    }

    const refund = await stripe.refunds.create(params);

    return res.status(200).json({ refund });
  } catch (err) {
    console.error("Refund error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}