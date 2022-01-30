// @ts-nocheck
export async function mineUntil(blockNumber: number): void {
  while ((await hre.ethers.provider.getBlockNumber()) < blockNumber) {
    await hre.network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}
