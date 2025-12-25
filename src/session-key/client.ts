import { http, type Hex, createPublicClient, zeroAddress, parseEther, encodeFunctionData, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { createKernelAccount, createKernelAccountClient } from "@botanary/sdk";
import { KERNEL_V3_3, getEntryPoint } from "@botanary/sdk/constants";
import { signerToEcdsaValidator } from "@botanary/ecdsa-validator";

import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.BUYER_PRIVATE_KEY as Hex;
const signer = privateKeyToAccount(PRIVATE_KEY as Hex);
const entryPoint = getEntryPoint("0.7");
const kernelVersion = KERNEL_V3_3;
const publicClient = createPublicClient({
  transport: http(process.env.INFURA_RPC_URL || ""),
  chain: sepolia,
});
const SERVER_URL = "http://localhost:3000";

async function main() {
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion,
  });
  const agentAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion,
  });
  console.log("Agent account address: ", agentAccount.address);
  const agentClient = createKernelAccountClient({
    account: agentAccount,
    chain: sepolia,
    bundlerTransport: http(process.env.ZERODEV_BUNDLER_RPC || ""),
    client: publicClient,
  });
  console.log("1️⃣  Calling API first...");
  const initialRes = await fetch(`${SERVER_URL}/weather`);
  if (initialRes.status === 402) {
    const errorBody = await initialRes.json();
    const paymentInfo = errorBody.paymentInfo;
    console.log("⚠️  Payment Required. Server asks for:");
    console.log(`   - To: ${paymentInfo.receiver}`);
    console.log(`   - Amount: ${paymentInfo.amount} (Wei)`);
    console.log(`   - Token: ${paymentInfo.token.symbol}`);
    console.log("2️⃣  Sending UserOperation...");

    const callData = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 amount)"]),
      functionName: "transfer",
      args: [paymentInfo.receiver, BigInt(paymentInfo.amount)],
    });
    const userOpHash = await agentClient.sendUserOperation({
      callData: await agentAccount.encodeCalls([
        {
          to: paymentInfo.token.address,
          value: 0n,
          data: callData,
        },
      ]),
    });

    const _receipt = await agentClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    const txHash = _receipt.receipt.transactionHash;
    console.log(txHash);
    
    const paidRes = await fetch(`${SERVER_URL}/weather`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${txHash}`,
      },
    });
    const data = await paidRes.json();
    console.log("3️⃣  Accessing paid API result:", data);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
