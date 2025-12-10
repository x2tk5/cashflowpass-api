import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Data = { refund?: Stripe.Response<Stripe.Refund>; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId, amount } = req.body as {
      paymentIntentId?: string;
      amount?: number;
    };

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Missing paymentIntentId" });
    }

    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      const amountInCents = Math.round(Number(amount) * 100);
      if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
        return res.status(400).json({ error: "Invalid amount value" });
      }
      params.amount = amountInCents;
    }

    const refund = await stripe.refunds.create(params);

    return res.status(200).json({ refund });
  } catch (err) {
    console.error("Error creating refund:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
