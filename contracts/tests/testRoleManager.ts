import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from "chai";

const maxUint256 = ethers.BigNumber.from(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

describe("RoleManager", function () {
  let signers: Signer[];
  let owner: Signer;
  let nonOwner: Signer;
  let addresses: string[];

  const startBlockNumber = 0;
  const batchLength = 10;

  let roleManagerFactory: any;
  let roleManager: any;
  let batchCounterFactory: any;
  let batchCounter: any;

  before(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    nonOwner = signers[1];
    addresses = await Promise.all(
      signers.slice(2, 5).map((s) => s.getAddress())
    );

    batchCounterFactory = await ethers.getContractFactory("BatchCounter");
    roleManagerFactory = await ethers.getContractFactory("RoleManager");
  });

  beforeEach(async function () {
    batchCounter = await batchCounterFactory.deploy(
      startBlockNumber,
      batchLength
    );
    roleManager = await roleManagerFactory.deploy(batchCounter.address);
  });

  it("should allow owner to appoint new accounts", async function () {
    let startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex, addresses[0], 1)
    )
      .to.emit(roleManager, "Appointed")
      .withArgs(addresses[0], 1, 0, startBatchIndex);

    expect(await roleManager.accounts(addresses[0])).to.eql([
      true,
      1,
      ethers.BigNumber.from(0),
      startBatchIndex,
      maxUint256,
    ]);

    startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(roleManager.appointGovernor(startBatchIndex, addresses[1], 10))
      .to.emit(roleManager, "Appointed")
      .withArgs(addresses[1], 4, 10, startBatchIndex);
    expect(await roleManager.accounts(addresses[1])).to.eql([
      true,
      4,
      ethers.BigNumber.from(10),
      startBatchIndex,
      maxUint256,
    ]);
  });

  it("should prevent non-owners to appoint new accounts", async function () {
    let startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager
        .connect(nonOwner)
        .appointNonGovernor(startBatchIndex, addresses[0], 1)
    ).to.be.reverted;
    startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager
        .connect(nonOwner)
        .appointGovernor(startBatchIndex, addresses[0], 10)
    ).to.be.reverted;
  });

  it("should prevent appointing account twice", async function () {
    let startBatchIndex = await batchCounter.currentBatchIndex();
    await roleManager.appointNonGovernor(startBatchIndex, addresses[0], 1);
    startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex, addresses[0], 1)
    ).to.be.reverted;
  });

  it("should prevent appointing to none role", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex, addresses[0], 0)
    ).to.be.reverted;
  });

  it("should prevent appointing for the past", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex - 1, addresses[0], 0)
    ).to.be.reverted;
  });

  it("should prevent appointing for non existant provinces", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(roleManager.appointGovernor(startBatchIndex, addresses[0], 75))
      .to.be.reverted;
  });

  it("should allow owner to dismiss accounts", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex, addresses[0], 1)
    );

    const endBatchIndex = (await batchCounter.currentBatchIndex()) + 1;
    await expect(roleManager.dismiss(addresses[0], endBatchIndex))
      .to.emit(roleManager, "Dismissed")
      .withArgs(addresses[0], endBatchIndex);

    expect(await roleManager.accounts(addresses[0])).to.eql([
      true,
      1,
      ethers.BigNumber.from(0),
      startBatchIndex,
      ethers.BigNumber.from(endBatchIndex),
    ]);
  });

  it("should prevent non-owners to dismiss accounts", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex, addresses[0], 1)
    );

    const endBatchIndex = (await batchCounter.currentBatchIndex()) + 1;
    await expect(
      roleManager.connect(nonOwner).dismiss(addresses[0], endBatchIndex)
    ).to.be.reverted;
  });

  it("should prevent dismissing non-existant accounts", async function () {
    const endBatchIndex = (await batchCounter.currentBatchIndex()) + 1;
    await expect(roleManager.dismiss(addresses[0], endBatchIndex)).to.be
      .reverted;
  });

  it("should prevent dismissing accounts for the past", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointNonGovernor(startBatchIndex, addresses[0], 1)
    );

    const endBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.connect(nonOwner).dismiss(addresses[0], endBatchIndex)
    ).to.be.reverted;
  });

  it("should return roles and provinces", async function () {
    const startBatchIndex = await batchCounter.currentBatchIndex();
    await expect(
      roleManager.appointGovernor(startBatchIndex, addresses[0], 10)
    );
    const resNotAppointed = [0, ethers.BigNumber.from(0)];
    const resAppointed = [4, ethers.BigNumber.from(10)];

    expect(
      await roleManager.roleAndProvince(addresses[0], startBatchIndex - 1)
    ).to.eql(resNotAppointed);
    expect(
      await roleManager.roleAndProvince(addresses[0], startBatchIndex)
    ).to.eql(resAppointed);
    expect(
      await roleManager.roleAndProvince(addresses[0], startBatchIndex + 1000)
    ).to.eql(resAppointed);

    const endBatchIndex = (await batchCounter.currentBatchIndex()) + 1;
    await roleManager.dismiss(addresses[0], endBatchIndex);

    expect(
      await roleManager.roleAndProvince(addresses[0], startBatchIndex - 1)
    ).to.eql(resNotAppointed);
    expect(
      await roleManager.roleAndProvince(addresses[0], startBatchIndex)
    ).to.eql(resAppointed);
    expect(
      await roleManager.roleAndProvince(addresses[0], endBatchIndex)
    ).to.eql(resAppointed);
    expect(
      await roleManager.roleAndProvince(addresses[0], endBatchIndex + 1)
    ).to.eql(resNotAppointed);
  });
});
