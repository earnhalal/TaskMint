import admin from 'firebase-admin';
import crypto from 'crypto';

// Wannads postback (Vercel serverless).
//
// Wannads calls this URL server-to-server when an offer completes or is
// reversed: user_id, amount, status ("credited"/"1" = pay, otherwise a
// reversal), trans_id, sig = md5(user_id + trans_id + amount + secret).
// Credits go to the REAL ledger (RTDB users/{uid}/balance, atomically)
// and are mirrored to Firestore + earning_history. Duplicate deliveries
// of the same trans_id + status are ignored via RTDB postback_log.
//
// Admin credentials: FIREBASE_SERVICE_ACCOUNT_KEY (JSON) on Vercel,
// falling back to Application Default Credentials. The Wannads secret
// is WANNADS_SECRET on Vercel.

function initAdmin() {
  if (admin.apps.length) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const options = {
    databaseURL:
      'https://earnapp-f8d27-default-rtdb.asia-southeast1.firebasedatabase.app/',
  };
  if (key) {
    options.credential = admin.credential.cert(JSON.parse(key));
  } else {
    options.credential = admin.credential.applicationDefault();
  }
  admin.initializeApp(options);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const p = req.method === 'GET' ? req.query : { ...req.query, ...req.body };
  const { user_id, amount, status, trans_id, sig } = p;

  // Wannads dashboard test ping — never credits.
  if (!user_id || user_id === '{subId}' || user_id === '') {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  }

  const secret = process.env.WANNADS_SECRET;
  if (!secret) {
    return res.status(500).send('Configuration Error');
  }

  const dataToHash = `${user_id}${trans_id}${amount}${secret}`;
  const calculatedSignature = crypto
    .createHash('md5')
    .update(dataToHash)
    .digest('hex');

  if (sig !== calculatedSignature) {
    res.setHeader('Content-Type', 'text/plain');
    return res
      .status(403)
      .send('ERROR: Invalid Signature. Expected MD5 of user_id+trans_id+amount+secret.');
  }

  const amountLocal = parseFloat(amount);
  if (isNaN(amountLocal) || !user_id) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(400).send('Invalid parameters');
  }

  // "credited"/"1" pays; anything else is a reversal of the same amount.
  const increment =
    status === 'credited' || status === '1'
      ? Math.abs(amountLocal)
      : -Math.abs(amountLocal);

  try {
    initAdmin();
    const rtdb = admin.database();
    const firestore = admin.firestore();

    // Dedupe per trans_id + direction: a repeated credit (or a repeated
    // reversal) is processed once; a genuine reversal after a credit
    // still goes through because its direction differs.
    if (trans_id) {
      const claimRef = rtdb.ref(
        `postback_log/wannads/${trans_id}_${increment >= 0 ? 'credit' : 'debit'}`,
      );
      const claim = await claimRef.transaction((current) => {
        if (current) return; // abort — already processed
        return { userId: user_id, amount: increment, at: Date.now() };
      });
      if (!claim.committed) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send('OK');
      }
    }

    // 1) RTDB — the real ledger (atomic increments).
    await rtdb.ref(`users/${user_id}`).update({
      balance: admin.database.ServerValue.increment(increment),
      totalEarnings: admin.database.ServerValue.increment(increment),
    });

    // 2) Firestore mirror + earning history.
    const userRef = firestore.collection('users').doc(user_id);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('User not found');
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(increment),
      totalEarnings: admin.firestore.FieldValue.increment(increment),
    });
    await firestore.collection('earning_history').add({
      userId: user_id,
      amount: increment,
      type: increment < 0 ? 'expense' : 'earning',
      source: 'wannads',
      description: `Wannads Offer (${trans_id})`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Wannads postback error:', error);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send('Error');
  }
}
