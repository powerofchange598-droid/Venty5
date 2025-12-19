import { readBody, verifySession } from '../_utils';
import { getPayPalAccessToken } from './utils';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

    try {
        const { amount, currency = 'USD' } = await readBody(req);
        
        // Validate inputs
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ ok: false, error: 'invalid_amount' });
        }

        // Get PayPal Token
        const { accessToken, baseUrl } = await getPayPalAccessToken();

        // Create Order
        const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: currency,
                        value: String(amount)
                    }
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PayPal Create Order Error:', data);
            throw new Error(data.message || 'paypal_create_failed');
        }

        return res.json({ ok: true, id: data.id });
    } catch (e: any) {
        console.error('Create Order Handler Error:', e);
        return res.status(500).json({ ok: false, error: e.message || 'server_error' });
    }
}
