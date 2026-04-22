const admin = require('firebase-admin');

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.database();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const { subid, virtual_currency } = req.query;

    if (!subid || !virtual_currency) {
        return res.status(400).send('Missing subid or virtual_currency');
    }

    try {
        // Update credit balance in Realtime Database under users/${subid}/credit_balance
        const userBalanceRef = db.ref(`users/${subid}/credit_balance`);
        await userBalanceRef.transaction((currentBalance) => {
            return (currentBalance || 0) + parseFloat(virtual_currency as string);
        });

        // Response must be strictly '1' per instructions
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send('1');
    } catch (error) {
        console.error("CPALead Postback Error:", error);
        return res.status(500).send('Error');
    }
}
