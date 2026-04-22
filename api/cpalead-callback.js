const admin = require('firebase-admin');

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}
const db = admin.database();

export default async function handler(req, res) {
  // Sirf GET requests allow karein
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const { subid, virtual_currency, lead_id } = req.query;

  // Check karein parameters mil rahay hain ya nahi
  if (!subid || !virtual_currency) {
    console.error("Missing parameters");
    return res.status(200).send('1'); // CPALead ko '1' bhej dein taake wo bar bar hit na kare
  }

  try {
    const userRef = db.ref(`users/${subid}`);
    
    // Transactional update taake balance sahi update ho
    await userRef.transaction((currentData) => {
      if (currentData) {
        currentData.credit_balance = (currentData.credit_balance || 0) + parseFloat(virtual_currency);
      }
      return currentData;
    });

    // Success response
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('1');

  } catch (error) {
    console.error("Firebase Error:", error);
    // Error ke bawajood '1' bhej dena behtar hai agar aap testing kar rahe hain
    return res.status(200).send('1'); 
  }
}
