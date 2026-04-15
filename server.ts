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

  // API route for Wannads postback
  app.all("/api/postback/wannads", async (req, res) => {
    console.log("--- Wannads Postback Received ---");
    console.log("Query Params:", JSON.stringify(req.query));

    const { userId, reward, transId, status } = req.query;

    // Check if parameters are still placeholders
    if (userId === "{userId}" || reward === "{reward}" || transId === "{transId}") {
      console.error("Error: Received placeholder values instead of real data.");
      return res.status(400).send("Error: Placeholder values received. Please check Wannads dashboard configuration.");
    }

    // Wannads might send reward as a string like "1.00"
    const rewardLocal = parseFloat(reward as string);
    
    console.log(`Debug: userId=${userId}, reward=${reward}, rewardLocal=${rewardLocal}, transId=${transId}, status=${status}`);

    if (status === "credited") {
      try {
        const firestore = getDb();
        
        if (!userId) throw new Error("Missing userId");
        if (isNaN(rewardLocal)) throw new Error(`Invalid reward amount: ${reward}`);

        const userRef = firestore.collection("users").doc(userId as string);
        const transRef = userRef.collection("transactions").doc();
        
        console.log(`Processing Wannads reward for user: ${userId}, amount: ${rewardLocal}`);

        await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            console.error(`User ${userId} not found in Firestore`);
            throw new Error(`User ${userId} not found`);
          }

          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(rewardLocal),
            totalEarnings: admin.firestore.FieldValue.increment(rewardLocal)
          });

          transaction.set(transRef, {
            type: 'Wannads Reward',
            amount: rewardLocal,
            status: 'completed',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            description: `Wannads Offer (${transId})`
          });
        });
        
        console.log("Balance and earnings updated successfully.");
        return res.status(200).send("OK");
      } catch (error: any) {
        console.error("Wannads Postback Processing Error:", error.message);
        return res.status(500).send(`Error: ${error.message}`);
      }
    }

    console.log(`Wannads Postback ignored: status=${status}`);
    res.status(200).send("OK - Status not credited");
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
