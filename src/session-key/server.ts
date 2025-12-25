import express, { type NextFunction, type Request, type Response } from "express";
import { createPublicClient, http, encodeFunctionData, parseAbi, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";

const app = express();
app.use(express.json());

const payTo = "0xd5de8324D526A201672B30584e495C71BeBb3e9A";
const TOKEN_CONFIG = {
  address: "0x940A4894a2c72231c9AD70E6D32B7edadC8F76e3" as Hex,
  name: "USD Coin",
  decimals: 18,
};
const REQUIRED_AMOUNT = 1000000000000000000n;
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://rpc.sepolia.org"),
});
const BUNDLER_RPC = "https://api.pimlico.io/v2/sepolia/rpc?apikey=public";
const bundlerClient = createBundlerClient({
  chain: sepolia,
  transport: http(BUNDLER_RPC),
});

const decodeAndCheckCallData = (userOpCallData: Hex): boolean => {
  try {
    const expectedTransferData = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 amount)"]),
      functionName: "transfer",
      args: [payTo as Hex, REQUIRED_AMOUNT],
    });
    const searchPattern = expectedTransferData.substring(2).toLowerCase();
    const fullCallData = userOpCallData.toLowerCase();
    if (fullCallData.includes(searchPattern)) {
      const tokenAddressClean = TOKEN_CONFIG.address.substring(2).toLowerCase();
      if (fullCallData.includes(tokenAddressClean)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Decode Error:", error);
    return false;
  }
};

const handleAgentPayment = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const paymentMetadata = {
      type: "PushPayment",
      networkId: sepolia.id,
      receiver: payTo,
      token: {
        symbol: TOKEN_CONFIG.name,
        address: TOKEN_CONFIG.address,
        decimals: TOKEN_CONFIG.decimals,
      },
      amount: REQUIRED_AMOUNT.toString(),
      instruction: "Send a UserOperation transferring this amount of USDC to the receiver.",
    };
    return res.status(402).json({
      error: "Payment required",
      message: "Please submit a UserOpHash in 'Authorization: Bearer <hash>' header",
      paymentInfo: paymentMetadata,
    });
  }

  const userOpHash = authHeader.replace("Bearer ", "") as Hex;

  try {
    console.log(`🔍 Checking UserOp: ${userOpHash}`);
    const userOp = await bundlerClient.getUserOperation({ hash: userOpHash });

    if (!userOp) {
      console.log("❌ UserOp not found or already mined");
      const receipt = await bundlerClient.getUserOperationReceipt({ hash: userOpHash }).catch(() => null);
      if (receipt && receipt.success) {
        console.log("✅ UserOp already mined successfully!");
        return next();
      }
      return res.status(403).json({ error: "UserOp not found in mempool" });
    }

    const isPaymentValid = decodeAndCheckCallData(userOp.userOperation.callData);
    if (!isPaymentValid) {
      console.log("❌ Payment data mismatch");
      return res.status(403).json({ error: "Payment data mismatch (Wrong amount/token/recipient)" });
    }
    console.log("⚡ Payment detected in Mempool. Serving content...");
    next();

    console.log("🐢 Waiting for on-chain confirmation...");
    bundlerClient
      .waitForUserOperationReceipt({ hash: userOpHash })
      .then((receipt) => {
        if (receipt.success) {
          console.log(`💰 Money secured! TxHash: ${receipt.receipt.transactionHash}`);
        } else {
          console.log("❌ Payment reverted on-chain!");
          // TODO: Blacklist user logic here
        }
      })
      .catch((err) => console.error("Wait receipt error:", err));
  } catch (e) {
    console.error("Validation failed:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Validation failed" });
    }
  }
};

app.get("/weather", handleAgentPayment, (req: Request, res: Response) => {
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
