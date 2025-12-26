import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { privateKeyToAccount } from "viem/accounts";
import { type Hex } from "viem";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const payTo = privateKeyToAccount(process.env.RECEIVER_PRIVATE_KEY! as Hex).address;
const NETWORK_ID = "eip155:11155111";
const TOKEN_CONFIG = {
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  name: "USDC",
  version: "2",
};
const facilitatorClient = new HTTPFacilitatorClient({
  url: "http://localhost:3636",
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

app.use(
  paymentMiddleware(
    {
      "GET /weather": {
        accepts: [
          {
            scheme: "exact",
            // price: "$0.01", //for default USDC coin
            price: {
              asset: TOKEN_CONFIG.address,
              amount: "1000000000000000000",
              extra: {
                name: TOKEN_CONFIG.name,
                version: TOKEN_CONFIG.version,
              },
            },
            network: NETWORK_ID,
            payTo,
          },
        ],
        description: "Premium Weather Data",
      },
    },
    server
  )
);

app.get("/weather", (req, res) => {
  res.send({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
});

app.listen(3000, () => {
  console.log(`Server listening at http://localhost:3000`);
});
