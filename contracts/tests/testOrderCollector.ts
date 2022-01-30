import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";

import { mineUntil } from "../utils/mining";

describe("OrderCollector", function () {
  let signers;
  let orderCollectorFactory: any;
  let orderCollector: any;
  let batchCounterFactory: any;
  let batchCounter: any;
  const orderLimit = 2;
  let startBlockNumber: number;
  const batchLength = 10;
  let playerSigners: Signer[];
  let nonPlayerSigner: Signer;
  let playerAddresses: string[];

  before(async function () {
    signers = await ethers.getSigners();
    playerSigners = signers.slice(1, 3);
    nonPlayerSigner = signers[3];
    playerAddresses = await Promise.all(
      playerSigners.map((s) => s.getAddress())
    );

    batchCounterFactory = await ethers.getContractFactory("BatchCounter");
    orderCollectorFactory = await ethers.getContractFactory("OrderCollector");
  });

  beforeEach(async function () {
    startBlockNumber = (await ethers.provider.getBlockNumber()) + 10;
    batchCounter = await batchCounterFactory.deploy(
      startBlockNumber,
      batchLength
    );
    orderCollector = await orderCollectorFactory.deploy(
      batchCounter.address,
      playerAddresses,
      orderLimit
    );
  });

  it("should emit orders as events", async function () {
    await mineUntil(startBlockNumber);
    expect(
      await orderCollector
        .connect(playerSigners[0])
        .submitEncryptedOrder(0, "0xaabbcc")
    )
      .to.emit(orderCollector, "EncryptedOrderSubmitted")
      .withArgs(0, playerAddresses[0], "0xaabbcc");

    await mineUntil(startBlockNumber + batchLength);
    expect(
      await orderCollector
        .connect(playerSigners[1])
        .submitEncryptedOrder(1, "0xaabbcc")
    )
      .to.emit(orderCollector, "EncryptedOrderSubmitted")
      .withArgs(1, playerAddresses[1], "0xaabbcc");
  });

  it("should reject orders before start block", async function () {
    await expect(
      orderCollector
        .connect(playerSigners[0])
        .submitEncryptedOrder(0, "0xaabbcc")
    ).to.be.reverted;
  });

  it("should reject orders from non players", async function () {
    await mineUntil(startBlockNumber);
    await expect(
      orderCollector
        .connect(nonPlayerSigner)
        .submitEncryptedOrder(0, "0xaabbcc")
    ).to.be.reverted;
  });

  it("should reject orders for wrong batches", async function () {
    await mineUntil(startBlockNumber + batchLength);
    const currentBatch = await batchCounter.currentBatchIndex();
    await expect(
      orderCollector
        .connect(playerSigners[1])
        .submitEncryptedOrder(currentBatch - 1, "0xaabbcc")
    ).to.be.reverted;
    await expect(
      orderCollector
        .connect(playerSigners[1])
        .submitEncryptedOrder(currentBatch + 1, "0xaabbcc")
    ).to.be.reverted;
  });
});
