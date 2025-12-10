import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Data = { subscription?: Stripe.Response<Stripe.Subscription>; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subscriptionId } = req.query as { subscriptionId?: string };

    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscriptionId" });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return res.status(200).json({ subscription });
  } catch (err) {
    console.error("Error retrieving subscription:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
