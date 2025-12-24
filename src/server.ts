import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

const app = express();

const payTo = "0xd5de8324D526A201672B30584e495C71BeBb3e9A";
const NETWORK_ID = "eip155:11155111";
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
            // price: "$0.01", for default USDC coin
            price: {
              asset: "0x940A4894a2c72231c9AD70E6D32B7edadC8F76e3",
              amount: "1000000000000000000",
              extra: {
                name: "USD Coin",
                version: "1",
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
