import { getEnv } from '../_utils';

export const getPayPalAccessToken = async () => {
    const CLIENT_ID = getEnv('PAYPAL_CLIENT_ID');
    const CLIENT_SECRET = getEnv('PAYPAL_CLIENT_SECRET');
    const MODE = getEnv('PAYPAL_MODE') || 'sandbox';
    const BASE_URL = MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('missing_paypal_credentials');
    }

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
        console.error('PayPal Token Error:', data);
        throw new Error('failed_to_get_paypal_token');
    }

    return { accessToken: data.access_token, baseUrl: BASE_URL };
};
