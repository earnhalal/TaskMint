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

  // API route for CPX callback
  app.get("/api/cpx-callback", async (req, res) => {
    const { status, user_id, amount, trans_id, hash } = req.query;
    const secretHash = "Knzx9CJGtJVM2tHOMGdpLT2DqXAK6c9Y";

    // Verify hash
    const dataToHash = `${status}${user_id}${amount}${trans_id}${secretHash}`;
    const calculatedHash = crypto.createHash("sha256").update(dataToHash).digest("hex");

    if (hash !== calculatedHash) {
      return res.status(403).send("Invalid hash");
    }

    if (status === "complete") {
      try {
        const firestore = getDb();
        const amountLocal = parseFloat(amount as string);
        const userRef = firestore.collection("users").doc(user_id as string);
        
        await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error("User does not exist!");
          }
          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(amountLocal)
          });
        });
        
        return res.status(200).send("OK");
      } catch (error: any) {
        console.error("Callback Error:", error.message);
        return res.status(500).send(error.message);
      }
    }

    res.status(200).send("Status not complete");
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
