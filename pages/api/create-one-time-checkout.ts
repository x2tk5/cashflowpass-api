import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Data = { url?: string; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, amount, successUrl, cancelUrl } = req.body;

    if (!email || !amount || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: "Missing fields: email, amount, successUrl, cancelUrl",
      });
    }

    const amountInCents = Math.round(Number(amount) * 100);

    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      customers.data[0] ?? (await stripe.customers.create({ email }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Cash Flow Pass One-Time Payment" },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url ?? "" });
  } catch (err) {
    console.error("One-time checkout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}