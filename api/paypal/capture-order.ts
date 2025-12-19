import { readBody, verifySession } from '../_utils';
import { getDb } from '../../lib/db';
import { getPayPalAccessToken } from './utils';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

    try {
        const { orderId } = await readBody(req);
        if (!orderId) return res.status(400).json({ ok: false, error: 'missing_order_id' });

        // Identify user (optional but good for linking)
        const cookie = String(req.headers.cookie || '');
        const sid = cookie.split(';').map(x => x.trim()).find(x => x.startsWith('venty_session='))?.split('=')[1] || '';
        const user = sid ? await verifySession(sid).catch(() => null) : null;

        // Get PayPal Token
        const { accessToken, baseUrl } = await getPayPalAccessToken();

        // Capture Order
        const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PayPal Capture Order Error:', data);
            throw new Error(data.message || 'paypal_capture_failed');
        }

        // Check if completed
        if (data.status === 'COMPLETED') {
            const capture = data.purchase_units[0].payments.captures[0];
            const payer = data.payer;
            
            // Store in DB
            const db = await getDb();
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            
            await db.run(
                `INSERT INTO transactions (id, order_id, user_id, amount, currency, status, payer_email, payer_name) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transactionId,
                    orderId,
                    user?.userId || null,
                    capture.amount.value,
                    capture.amount.currency_code,
                    'COMPLETED',
                    payer.email_address,
                    `${payer.name.given_name} ${payer.name.surname}`
                ]
            );

            return res.json({ 
                ok: true, 
                details: {
                    payer: {
                        name: `${payer.name.given_name} ${payer.name.surname}`,
                        email: payer.email_address
                    },
                    status: 'COMPLETED',
                    amount: capture.amount.value
                }
            });
        } else {
            return res.status(400).json({ ok: false, error: 'payment_not_completed', status: data.status });
        }

    } catch (e: any) {
        console.error('Capture Order Handler Error:', e);
        return res.status(500).json({ ok: false, error: e.message || 'server_error' });
    }
}
