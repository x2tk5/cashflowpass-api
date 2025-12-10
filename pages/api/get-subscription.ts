import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Data = { subscription?: any; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subscriptionId } = req.query;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscriptionId" });
    }

    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId as string
    );

    return res.status(200).json({ subscription });
  } catch (err) {
    console.error("Get subscription error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}