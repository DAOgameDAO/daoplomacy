import { ethers } from "ethers";
import * as OrderCollectorDeployment from "./assets/deployment/OrderCollector.json";
import * as BatchCounterDeployment from "./assets/deployment/BatchCounter.json";

export const contractsDeployed = !!parseInt(
  import.meta.env.VITE_CONTRACTS_DEPLOYED
);

export const provider = new ethers.providers.JsonRpcProvider(
  import.meta.env.VITE_ETHEREUM_RPC_URL
);

export let orderCollector: ethers.Contract | null;
export let batchCounter: ethers.Contract | null;
if (contractsDeployed) {
  orderCollector = new ethers.Contract(
    OrderCollectorDeployment.address,
    OrderCollectorDeployment.abi,
    provider
  );
  batchCounter = new ethers.Contract(
    BatchCounterDeployment.address,
    BatchCounterDeployment.abi,
    provider
  );
} else {
  orderCollector = null;
  batchCounter = null;
}

const orderCollectorInterface = new ethers.utils.Interface(
  OrderCollectorDeployment.abi
);

export function encodeOrderSubmissionCalldata(
  phase: number,
  encryptedOrder: string
): string {
  const params = [phase, encryptedOrder];
  return orderCollectorInterface.encodeFunctionData(
    "submitEncryptedOrder",
    params
  );
}

export function decodeOrderSubmissionCalldata(
  calldata: string
): [number, string] {
  const r = orderCollectorInterface.decodeFunctionData(
    "submitEncryptedOrder",
    ethers.utils.arrayify(calldata)
  );
  return [r.batchIndex, r.encryptedOrder];
}
