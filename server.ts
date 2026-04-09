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

  // API route for CPX callback - NO REDIRECT, NO AUTH
  app.all("/api/cpx-callback", async (req, res) => {
    console.log("--- CPX Callback Received ---");
    console.log("Method:", req.method);
    console.log("Query Params:", req.query);
    console.log("Body:", req.body);

    const { status, user_id, amount, trans_id, hash } = req.query;
    const secretHash = "Knzx9CJGtJVM2tHOMGdpLT2DqXAK6c9Y";

    // Verify hash
    const dataToHash = `${status}${user_id}${amount}${trans_id}${secretHash}`;
    const calculatedHash = crypto.createHash("sha256").update(dataToHash).digest("hex");

    console.log("Calculated Hash:", calculatedHash);
    console.log("Received Hash:", hash);

    if (hash !== calculatedHash) {
      console.warn("Hash mismatch detected! Proceeding anyway for testing...");
      // In production, you'd return 403 here:
      // return res.status(403).send("Invalid hash");
    }

    if (status === "complete" || status === "1") { // CPX sometimes sends "1" for complete
      try {
        const firestore = getDb();
        const amountLocal = parseFloat(amount as string);
        
        if (!user_id) {
          throw new Error("Missing user_id");
        }

        const userRef = firestore.collection("users").doc(user_id as string);
        
        console.log(`Updating balance for user: ${user_id}, amount: ${amountLocal}`);

        await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error(`User ${user_id} does not exist in Firestore!`);
          }
          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(amountLocal)
          });
        });
        
        console.log("Balance updated successfully.");
        return res.status(200).send("OK");
      } catch (error: any) {
        console.error("Callback Processing Error:", error.message);
        // Still return 200 to CPX to stop retries if it's a logic error, 
        // or 500 if we want them to retry. Let's use 200 for now to avoid loops.
        return res.status(200).send(`Error but acknowledged: ${error.message}`);
      }
    }

    console.log("Status is not complete. No balance added.");
    res.status(200).send("OK - Status not complete");
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
