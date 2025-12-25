import express, {type NextFunction, type Request, type Response } from "express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import type { PaymentRequirements } from "@x402/express"; 
import { privateKeyToAccount } from "viem/accounts";
import { type Hex } from "viem";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const payTo = privateKeyToAccount(process.env.RECEIVER_PRIVATE_KEY! as Hex).address;
const NETWORK_ID = "eip155:11155111";
const TOKEN_CONFIG = {
  address: "0x940A4894a2c72231c9AD70E6D32B7edadC8F76e3",
  name: "USD Coin",
  version: "1", 
};
const TOKEN_AMOUNT = "1000000000000000000";
const facilitatorClient = new HTTPFacilitatorClient({
  url: "http://localhost:3636",
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

const handleOptimisticPayment = async (req: Request, res: Response, next: NextFunction) => {
  const PAYMENT_OPTION : PaymentRequirements = {
    scheme: "exact",
    network: NETWORK_ID,
    payTo: payTo,
    amount: TOKEN_AMOUNT,
    asset: TOKEN_CONFIG.address,
    maxTimeoutSeconds: 300,
    extra: {
      name: TOKEN_CONFIG.name,
      version: TOKEN_CONFIG.version,
    },
  };

  try {
    let rawHeader = req.headers["payment-signature"] || req.headers["authorization"] || req.headers["l402"];
    if (Array.isArray(rawHeader)) rawHeader = rawHeader[0];
    const authHeader = rawHeader;

    if (!authHeader) {
      const protocol = req.protocol;
      const host = req.get("host");
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;

      const requirements = {
        x402Version: 2,
        error: "Payment required",
        resource: {
          url: fullUrl, 
          description: "Premium Weather Data",
          mimeType: "", 
        },
        accepts: [PAYMENT_OPTION],
      };

      const tokenString = JSON.stringify(requirements);
      const tokenBase64 = Buffer.from(tokenString).toString("base64");

      res.set("payment-required", tokenBase64);
      
      res.set("Access-Control-Expose-Headers", "payment-required");

      return res.status(402).json({}); 
    }

    let tokenBase64 = authHeader;
    if (tokenBase64.startsWith("L402") || tokenBase64.startsWith("l402")) {
        tokenBase64 = tokenBase64.replace(/^L402\s+/i, "");
    }

    const paymentPayload = JSON.parse(Buffer.from(tokenBase64, "base64").toString("utf-8"));

    const verifyResult = await facilitatorClient.verify(paymentPayload, PAYMENT_OPTION);

    if (!verifyResult.isValid) {
      console.error("❌ Verify Failed:", verifyResult.invalidReason);
      return res.status(403).json({ error: "Invalid signature" });
    }

    console.log("⚡ Verify OK! Serving content immediately...");
    next();

    console.log("🐢 Starting background settlement...");
    facilitatorClient
      .settle(paymentPayload, PAYMENT_OPTION)
      .then((result) => {
        if (result.success) {
          console.log("✅ Background Settle Success: Transaction sent!");
        } else {
          console.error("❌ Background Settle Failed:", result.errorReason);
        }
      })
      .catch((err) => console.error("❌ Settle System Error:", err));
  } catch (error) {
    console.error("Middleware Error:", error);
    if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

app.get("/weather", handleOptimisticPayment, (req, res) => {
  res.send({
    report: {
      location: "Vietnam",
      weather: "sunny",
      temperature: 70,
      note: "Served instantly via Optimistic Payment",
    },
  });
});

app.listen(3000, () => {
  console.log(`🚀 Optimistic Server listening at http://localhost:3000`);
});