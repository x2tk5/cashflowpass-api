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
    const { email, safeMonthlyAmount, successUrl, cancelUrl } = req.body;

    if (!email || !safeMonthlyAmount || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error:
          "Missing fields: email, safeMonthlyAmount, successUrl, cancelUrl",
      });
    }

    const amountInCents = Math.round(Number(safeMonthlyAmount) * 100);

    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      customers.data[0] ?? (await stripe.customers.create({ email }));

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Cash Flow Pass Repayment Plan" },
            unit_amount: amountInCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url ?? "" });
  } catch (err) {
    console.error("Subscription checkout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}