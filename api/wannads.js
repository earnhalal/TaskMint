import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Assumes Vercel environment variables
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { user_id, amount, status, trans_id, sig } = req.method === 'GET' ? req.query : req.body;
    
    const secret = process.env.WANNADS_SECRET;
    if (!secret) {
        return res.status(500).send('Configuration Error');
    }

    const dataToHash = `${user_id}${trans_id}${amount}${secret}`;
    const calculatedSignature = crypto.createHash("md5").update(dataToHash).digest("hex");

    if (sig !== calculatedSignature) {
        return res.status(403).send(`ERROR: Invalid Signature. Expected MD5 of user_id+trans_id+amount+secret. Got sig: ${sig}, but we calculated: ${calculatedSignature}. Hash string (without secret): ${user_id}${trans_id}${amount}`);
    }

    const amountLocal = parseFloat(amount);
    
    if (isNaN(amountLocal) || !user_id) {
        return res.status(400).send('Invalid parameters');
    }

    try {
        const userRef = db.collection("users").doc(user_id);
        const transRef = db.collection("earning_history").doc();
        
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error("User not found");

            const increment = status === "credited" || status === "1" ? amountLocal : -Math.abs(amountLocal);
            
            transaction.update(userRef, {
                balance: admin.firestore.FieldValue.increment(increment),
                totalEarnings: admin.firestore.FieldValue.increment(increment)
            });

            transaction.set(transRef, {
                userId: user_id,
                amount: increment,
                type: increment < 0 ? 'expense' : 'earning',
                source: 'wannads',
                description: `Wannads Offer (${trans_id})`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send('OK');
    } catch (error) {
        return res.status(500).send('Error');
    }
}
