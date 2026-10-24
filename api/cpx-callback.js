import admin from 'firebase-admin';

// CPX Research postback (Vercel serverless).
//
// CPX calls this URL server-to-server when a user completes a survey:
//   https://taskmint.click/api/cpx-callback?user_id={uid}&amount_local={amount}&status=1&trans_id={id}
// The reward is credited to the REAL ledger (RTDB users/{uid}/balance,
// atomically) and mirrored to Firestore + earning_history — the same
// money path as every other credit in the app. Duplicate deliveries of
// the same trans_id are ignored via RTDB postback_log.
//
// Admin credentials: FIREBASE_SERVICE_ACCOUNT_KEY (JSON) on Vercel,
// falling back to Application Default Credentials.

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
  res.setHeader('Content-Type', 'text/plain');
  const p = { ...(req.query || {}), ...(req.body || {}) };
  const { status, user_id, amount_local, trans_id } = p;

  // CPX dashboard test ping — never credits.
  if (!user_id || user_id === 'test' || String(user_id).includes('{')) {
    return res.status(200).send('OK');
  }

  // Only completed surveys pay. Anything else is acknowledged so CPX
  // does not retry forever.
  if (status !== '1' && status !== 'complete') {
    return res.status(200).send('OK');
  }

  const amountNum = parseFloat(amount_local || p.amount || '0');
  if (!user_id || isNaN(amountNum) || amountNum <= 0) {
    return res.status(200).send('OK');
  }

  try {
    initAdmin();
    const rtdb = admin.database();
    const firestore = admin.firestore();

    // Dedupe: claim this trans_id once; retries return OK without paying.
    if (trans_id) {
      const claimRef = rtdb.ref(`postback_log/cpx/${trans_id}`);
      const claim = await claimRef.transaction((current) => {
        if (current) return; // abort — already processed
        return { userId: user_id, amount: amountNum, at: Date.now() };
      });
      if (!claim.committed) {
        return res.status(200).send('OK');
      }
    }

    // 1) RTDB — the real ledger (atomic increments).
    await rtdb.ref(`users/${user_id}`).update({
      balance: admin.database.ServerValue.increment(amountNum),
      totalEarnings: admin.database.ServerValue.increment(amountNum),
    });

    // 2) Firestore mirror + earning history.
    const userRef = firestore.collection('users').doc(user_id);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(amountNum),
        totalEarnings: admin.firestore.FieldValue.increment(amountNum),
      });
    }
    await firestore.collection('earning_history').add({
      userId: user_id,
      amount: amountNum,
      type: 'earning',
      source: 'cpx_research',
      description: `CPX Survey Reward (${trans_id || 'N/A'})`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send('OK');
  } catch (error) {
    console.error('CPX postback error:', error);
    // Still 200 so CPX does not hammer retries; the failure is logged.
    return res.status(200).send('OK');
  }
}
