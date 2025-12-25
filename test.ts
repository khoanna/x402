import { createPublicClient, http, encodeFunctionData, parseAbi, type Hex } from "viem";
import { sepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.INFURA_RPC_URL || "https://rpc.sepolia.org"),
});