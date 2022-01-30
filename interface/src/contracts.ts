import { ethers } from "ethers";
import * as OrderCollectorDeployment from "./assets/deployment/OrderCollector.json";
import * as BatchCounterDeployment from "./assets/deployment/BatchCounter.json";

export const provider = new ethers.providers.JsonRpcProvider(
  import.meta.env.VITE_ETHEREUM_RPC_URL
);

export const orderCollector = new ethers.Contract(
  OrderCollectorDeployment.address,
  OrderCollectorDeployment.abi,
  provider
);

export const batchCounter = new ethers.Contract(
  BatchCounterDeployment.address,
  BatchCounterDeployment.abi,
  provider
);

export function encodeOrderSubmissionCalldata(
  phase: number,
  encryptedOrder: string
): string {
  const params = [phase, encryptedOrder];
  return orderCollector.interface.encodeFunctionData(
    "submitEncryptedOrder",
    params
  );
}

export function decodeOrderSubmissionCalldata(
  calldata: string
): [number, string] {
  const r = orderCollector.interface.decodeFunctionData(
    "submitEncryptedOrder",
    ethers.utils.arrayify(calldata)
  );
  return [r.batchIndex, r.encryptedOrder];
}
