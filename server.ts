import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import admin from "firebase-admin";

// Lazy initialization for Firebase Admin
let db: admin.firestore.Firestore | null = null;

function getDb() {
  if (!db) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Please add it to your secrets.");
    }
    try {
      const serviceAccount = JSON.parse(key);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      db = admin.firestore();
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY format.");
    }
  }
  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for CPALead callback
  app.all("/api/cpalead-callback", async (req, res) => {
    console.log("--- CPALead Postback Received ---");
    console.log("Query Params:", req.query);
    console.log("Client IP:", req.ip);

    // Security: Whitelist CPALead IP 34.69.179.33
    // Note: req.ip might need adjustment depending on proxy/cloud run headers
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const allowedIp = "34.69.179.33";

    if (clientIp !== allowedIp) {
      console.warn(`Unauthorized access attempt from IP: ${clientIp}`);
      // Temporarily allowing other IPs for testing purposes, remove in production
      // return res.status(403).send("Forbidden");
    }

    const { subid, virtual_currency, transaction_id } = req.query;

    if (!subid || !virtual_currency || !transaction_id) {
        console.error("Missing required parameters in CPALead postback");
        return res.status(400).send("Missing parameters");
    }

    console.log('Updating balance for:', subid, 'Amount:', virtual_currency);

    try {
        const firestore = getDb();
        const rtdbAdmin = admin.database();

        // 1. Log transaction to /leads/{lead_id} path in RTDB to prevent duplicate
        const leadRef = rtdbAdmin.ref(`leads/${transaction_id}`);
        const leadSnapshot = await leadRef.once('value');
        
        if (leadSnapshot.exists()) {
            console.log(`Duplicate lead detected: ${transaction_id}`);
            return res.status(200).send('1'); // Return 1 to stop multiple processing
        }

        await leadRef.set({
            subid,
            amount: parseFloat(virtual_currency as string),
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        // 2. Update user's credit_balance in Realtime Database
        const userBalanceRef = rtdbAdmin.ref(`users/${subid}/credit_balance`);
        await userBalanceRef.transaction((currentBalance) => {
            return (currentBalance || 0) + parseFloat(virtual_currency as string);
        });

        // 3. Update user's balance in Firestore
        const amount = parseFloat(virtual_currency as string);
        const userRef = firestore.collection("users").doc(subid as string);
        const transRef = firestore.collection("earning_history").doc();
        
        await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            console.error(`User ${subid} not found in Firestore`);
            throw new Error(`User ${subid} not found`);
          }

          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            totalEarnings: admin.firestore.FieldValue.increment(amount)
          });

          transaction.set(transRef, {
            userId: subid,
            amount: amount,
            status: 'completed',
            type: 'cpalead',
            description: `CPALead Offer (${transaction_id})`,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        });

        console.log(`Successfully credited ${virtual_currency} to user ${subid} in both DBs`);

        // Response must be strictly '1'
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send('1');
    } catch (error) {
        console.error("CPALead Postback processing error:", error);
        res.status(500).send("Error processing postback");
    }
  });

  // API route for CPX postback - NO REDIRECT, NO AUTH
  app.all("/api/cpx-postback", async (req, res) => {
    console.log("--- CPX Postback Received ---");
    console.log("Method:", req.method);
    console.log("Query Params:", req.query);

    const { status, user_id, amount, trans_id, hash } = req.query;
    const secretHash = "Knzx9CJGtJVM2tHOMGdpLT2DqXAK6c9Y";

    // Verify hash
    const dataToHash = `${status}${user_id}${amount}${trans_id}${secretHash}`;
    const calculatedHash = crypto.createHash("sha256").update(dataToHash).digest("hex");

    if (hash !== calculatedHash) {
      console.warn("Hash mismatch detected! Calculated:", calculatedHash, "Received:", hash);
      // Proceeding for testing, but in production this should be strict
    }

    if (status === "complete" || status === "1") {
      try {
        const firestore = getDb();
        const amountLocal = parseFloat(amount as string);
        
        if (!user_id) throw new Error("Missing user_id");

        const userRef = firestore.collection("users").doc(user_id as string);
        const transRef = userRef.collection("transactions").doc();
        
        console.log(`Processing survey reward for user: ${user_id}, amount: ${amountLocal}`);

        await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error(`User ${user_id} not found`);
          }

          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(amountLocal),
            totalEarnings: admin.firestore.FieldValue.increment(amountLocal)
          });

          transaction.set(transRef, {
            type: 'Survey Reward',
            amount: amountLocal,
            status: 'completed',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            description: `CPX Research Survey (${trans_id})`
          });
        });
        
        console.log("Balance and earnings updated, transaction recorded.");
        return res.status(200).send("OK");
      } catch (error: any) {
        console.error("Postback Processing Error:", error.message);
        return res.status(200).send(`Error acknowledged: ${error.message}`);
      }
    }

    res.status(200).send("OK - Status not complete");
  });

  // API route for Wannads postback - matching exact URL pattern requested
  app.all("/postback/wannads.php", async (req, res) => {
    console.log("--- Wannads Postback Received (PHP route) ---");
    
    // Parameters: user_id, amount, status, trans_id, sig
    const { user_id, amount, status, trans_id, sig } = req.query;
    
    const secret = process.env.WANNADS_SECRET;
    if (!secret) {
        console.error("WANNADS_SECRET is not defined in environment variables");
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).send("Configuration Error");
    }

    // Verify signature: md5(user_id . trans_id . amount . secret)
    const dataToHash = `${user_id}${trans_id}${amount}${secret}`;
    const calculatedSignature = crypto.createHash("md5").update(dataToHash).digest("hex");

    if (sig !== calculatedSignature) {
      console.warn("Signature mismatch! Calculated:", calculatedSignature, "Received:", sig);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(403).send("ERROR: Invalid Signature");
    }

    const amountLocal = parseFloat(amount as string);
    const userId = user_id as string;
    
    if (isNaN(amountLocal) || !userId) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(400).send("Invalid parameters");
    }

    try {
        const firestore = getDb();
        const userRef = firestore.collection("users").doc(userId);
        const transRef = userRef.collection("transactions").doc();
        
        await firestore.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                console.error(`User ${userId} not found`);
                throw new Error("User not found");
            }

            // If status is '1' or 'credited', add the balance. If '2' (revoke), subtract it.
            const increment = (status == "1" || status == "credited") ? amountLocal : -Math.abs(amountLocal);
            
            transaction.update(userRef, {
                balance: admin.firestore.FieldValue.increment(increment),
                totalEarnings: admin.firestore.FieldValue.increment(increment)
            });

            transaction.set(transRef, {
                type: 'Wannads Reward',
                amount: increment,
                status: (status == "1" || status == "credited") ? 'completed' : 'revoked',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                description: `Wannads Offer (${trans_id})`
            });
        });
        
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send("OK");
    } catch (error: any) {
        console.error("Wannads Postback Error:", error);
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).send("Error");
    }
  });

  // Simple test endpoint
  app.get("/api/test", (req, res) => {
    res.status(200).send("API is working!");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
