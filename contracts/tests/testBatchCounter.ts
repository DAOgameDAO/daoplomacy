import { ethers } from "hardhat";
import { expect } from "chai";

describe("BatchCounter", function () {
  const startBlock = 10;
  const length = 5;
  let batchCounterFactory: any;
  let batchCounter: any;

  before(async function () {
    batchCounterFactory = await ethers.getContractFactory("BatchCounter");
  });

  beforeEach(async function () {
    batchCounter = await batchCounterFactory.deploy(startBlock, length);
  });

  it("should start at start block", async function () {
    expect(await batchCounter.hasStartedAtBlock(startBlock - 1)).to.be.false;
    expect(await batchCounter.hasStartedAtBlock(startBlock)).to.be.true;
  });

  it("should calculate correct start batch indices", async function () {
    expect(await batchCounter.batchIndexForBlock(startBlock)).to.equal(0);
    expect(
      await batchCounter.batchIndexForBlock(startBlock + length - 1)
    ).to.equal(0);
    expect(await batchCounter.batchIndexForBlock(startBlock + length)).to.equal(
      1
    );
    expect(
      await batchCounter.batchIndexForBlock(startBlock + 2 * length - 1)
    ).to.equal(1);
    expect(
      await batchCounter.batchIndexForBlock(startBlock + 2 * length)
    ).to.equal(2);
  });

  it("should revert when trying to calculate batch index before start", async function () {
    await expect(batchCounter.batchIndexForBlock(startBlock - 1)).to.be
      .reverted;
  });

  it("should calculate correct batch start block numbers", async function () {
    expect(await batchCounter.batchStartBlock(0)).to.equal(startBlock);
    expect(await batchCounter.batchStartBlock(1)).to.equal(startBlock + length);
    expect(await batchCounter.batchStartBlock(2)).to.equal(
      startBlock + length * 2
    );
  });
});
