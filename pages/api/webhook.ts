import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Data = { received?: boolean; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: "Webhook not configured" });
  }

  try {
    const buf = await buffer(req);

    const event = stripe.webhooks.constructEvent(
      buf,
      sig as string,
      webhookSecret
    );

    console.log("Webhook received:", event.type);

    return res.status(200).json({ received: true });
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
}