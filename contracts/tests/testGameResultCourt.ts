import { ethers } from "hardhat";
import { Signer } from "ethers";
import chai from "chai";
import { expect } from "chai";
import { smock } from "@defi-wonderland/smock";
import { mineUntil } from "../utils/mining";
import IArbitrator from "../artifacts/@kleros/erc-792/contracts/IArbitrator.sol/IArbitrator.json";

chai.use(smock.matchers);

describe("GameResultCourt", function () {
  let signers: Signer[];
  let hostSigner: Signer;
  let hostAddress: string;
  let playerSigners: Signer[];
  let playerAddresses: string[];
  let arbitrarySigner: Signer;
  let arbitraryAddress: string;
  let fakeArbitrator: any;
  let winners: string[];

  const challengePeriod = 10;

  let gameResultCourtFactory: any;
  let gameResultCourt: any;

  before(async function () {
    signers = await ethers.getSigners();
    hostSigner = signers[0];
    hostAddress = await hostSigner.getAddress();
    playerSigners = signers.slice(1, 3);
    playerAddresses = await Promise.all(
      playerSigners.map((s) => s.getAddress())
    );
    winners = await Promise.all(signers.slice(3, 5).map((s) => s.getAddress()));
    arbitrarySigner = signers[5];
    arbitraryAddress = await arbitrarySigner.getAddress();

    gameResultCourtFactory = await ethers.getContractFactory("GameResultCourt");
  });

  beforeEach(async function () {
    fakeArbitrator = await smock.fake(IArbitrator.abi);
    await signers[0].sendTransaction({
      to: fakeArbitrator.address,
      value: ethers.utils.parseEther("1.0"),
    });

    gameResultCourt = await gameResultCourtFactory.deploy(
      hostAddress,
      fakeArbitrator.address,
      challengePeriod,
      playerAddresses
    );
  });

  //
  // submit result
  //
  it("should allow host to submit results", async function () {
    await expect(
      gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    )
      .to.emit(gameResultCourt, "ResultSubmitted")
      .withArgs(0, hostAddress, winners);
  });

  it("should allow players to submit results", async function () {
    await expect(
      gameResultCourt.connect(playerSigners[0]).submitResultAsPlayer(0, winners)
    )
      .to.emit(gameResultCourt, "ResultSubmitted")
      .withArgs(0, playerAddresses[0], winners);
    await expect(
      gameResultCourt.connect(playerSigners[1]).submitResultAsPlayer(1, winners)
    )
      .to.emit(gameResultCourt, "ResultSubmitted")
      .withArgs(1, playerAddresses[1], winners);

    await expect(
      gameResultCourt.connect(playerSigners[0]).submitResultAsPlayer(1, winners)
    ).to.be.reverted; // wrong index
  });

  it("should not allow arbitrary accounts to submit results", async function () {
    await expect(
      gameResultCourt.connect(arbitrarySigner).submitResultAsHost(winners)
    ).to.be.reverted;
  });

  it("should not allow submitting results when already finalized", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    await gameResultCourt
      .connect(arbitrarySigner)
      .finalizeUnchallengedResult(0);
    await expect(
      gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).to.be.reverted;
  });

  //
  // finalize unchallenged result
  //
  it("should allow finalizing unchallenged results after challenge period", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    expect(await gameResultCourt.isFinalized()).to.be.false;
    await expect(
      gameResultCourt.connect(arbitrarySigner).finalizeUnchallengedResult(0)
    )
      .to.emit(gameResultCourt, "ResultFinalized")
      .withArgs(0, winners, false, false);
    expect(await gameResultCourt.isFinalized()).to.be.true;
    expect(await gameResultCourt.getWinners()).to.eql(winners);
  });

  it("should not allow finalizing unchallenged results during challenge period", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 2);
    await expect(
      gameResultCourt.connect(arbitrarySigner).finalizeUnchallengedResult(0)
    ).to.be.reverted;
  });

  it("should not allow finalizing challenged results", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await gameResultCourt.connect(hostSigner).challengeResultAsHost(0);
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    await expect(
      gameResultCourt.connect(arbitrarySigner).finalizeUnchallengedResult(0)
    ).to.be.reverted;
  });

  it("should not allow finalizing results in arbitration", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    await expect(
      gameResultCourt.connect(arbitrarySigner).finalizeUnchallengedResult(0)
    ).to.be.reverted;
  });

  it("should not allow finalizing results if already finalized", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    await gameResultCourt
      .connect(arbitrarySigner)
      .finalizeUnchallengedResult(0);
    await expect(
      gameResultCourt.connect(arbitrarySigner).finalizeUnchallengedResult(1)
    ).to.be.reverted;
  });

  //
  // challenging
  //
  it("should allow the host to challenge results", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    await expect(gameResultCourt.connect(hostSigner).challengeResultAsHost(0))
      .to.emit(gameResultCourt, "ResultChallenged")
      .withArgs(0, hostAddress);
    expect((await gameResultCourt.results(0))[1]).to.be.true;
  });

  it("should not allow non-host accounts to challenge results", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    await expect(
      gameResultCourt.connect(playerSigners[0]).challengeResultAsHost(0)
    ).to.be.reverted;
    await expect(
      gameResultCourt.connect(arbitrarySigner).challengeResultAsHost(0)
    ).to.be.reverted;
  });

  //
  // requesting arbitration
  //
  it("should allow players to request arbitration of unchallenged results", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();

    fakeArbitrator.createDispute.returns(1);

    await expect(
      gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0)
    )
      .to.emit(gameResultCourt, "ArbitrationRequested")
      .withArgs(0, 0, 1);
    expect(fakeArbitrator.createDispute).to.have.been.calledOnceWith(
      2,
      ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256"],
        [winners, submitReceipt.blockNumber]
      )
    );
  });

  it("should allow players to request arbitration of challenged results", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await gameResultCourt.connect(hostSigner).challengeResultAsHost(0);

    fakeArbitrator.createDispute.returns(1);

    expect(
      await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0)
    )
      .to.emit(gameResultCourt, "ArbitrationRequested")
      .withArgs(0, 0, 1);
    expect(fakeArbitrator.createDispute).to.have.been.calledOnceWith(
      2,
      ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256"],
        [winners, submitReceipt.blockNumber]
      )
    );
  });

  it("should not allow players to request arbitration after finalization", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 2);
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    await gameResultCourt
      .connect(arbitrarySigner)
      .finalizeUnchallengedResult(0);

    fakeArbitrator.createDispute.returns(1);
    await expect(
      gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 1)
    ).to.be.reverted;
  });

  it("should not allow players to request arbitration after challenge period is over", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);

    fakeArbitrator.createDispute.returns(1);
    await expect(
      gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0)
    ).to.be.reverted;
  });

  it("should not allow non-player accounts to request arbitration", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);

    fakeArbitrator.createDispute.returns(1);

    await expect(gameResultCourt.connect(hostSigner).requestArbitration(0, 0))
      .to.be.reverted;
    await expect(
      gameResultCourt.connect(arbitrarySigner).requestArbitration(0, 0)
    ).to.be.reverted;
    await expect(
      gameResultCourt.connect(playerSigners[0]).requestArbitration(1, 0) // wrong index
    ).to.be.reverted;
  });

  //
  // ruling
  //
  it("should finalize results if arbitration returns 1", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 1))
      .to.emit(gameResultCourt, "ResultFinalized")
      .withArgs(0, winners, true, true)
      .to.emit(gameResultCourt, "Ruling")
      .withArgs(fakeArbitrator.address, 5, 1);
    expect(await gameResultCourt.isFinalized()).to.be.true;
    expect(await gameResultCourt.getWinners()).to.eql(winners);
  });

  it("should not finalize results if arbitration returns something else", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 0))
      .to.emit(gameResultCourt, "Ruling")
      .withArgs(fakeArbitrator.address, 5, 0)
      .to.not.emit(gameResultCourt, "ResultFinalized");
    expect(await gameResultCourt.isFinalized()).to.be.false;

    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(6);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 1);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(6, 2))
      .to.emit(gameResultCourt, "Ruling")
      .withArgs(fakeArbitrator.address, 6, 2)
      .to.not.emit(gameResultCourt, "ResultFinalized");
    expect(await gameResultCourt.isFinalized()).to.be.false;
  });

  it("should not finalize results via arbitration if already finalized", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 1);

    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    await gameResultCourt
      .connect(arbitrarySigner)
      .finalizeUnchallengedResult(0);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 1))
      .to.emit(gameResultCourt, "Ruling")
      .withArgs(fakeArbitrator.address, 5, 1)
      .to.not.emit(gameResultCourt, "ResultFinalized");
  });

  it("should only allow arbitrator to rule", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(gameResultCourt.connect(arbitrarySigner).rule(5, 1)).to.be
      .reverted;
  });

  it("should not allow arbitration if not requested", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 1)).to
      .be.reverted;
  });

  it("should not allow ruling twice", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 1);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 1)).to
      .be.reverted;
  });

  //
  // finalize failed arbitrations
  //
  it("should allow host to finalize result if arbitration fails", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 0));

    await expect(
      gameResultCourt.connect(hostSigner).finalizeFailedArbitrationResult(0)
    )
      .to.emit(gameResultCourt, "ResultFinalized")
      .withArgs(0, winners, true, false);

    expect(await gameResultCourt.isFinalized()).to.be.true;
    expect(await gameResultCourt.getWinners()).to.eql(winners);
  });

  it("should not allow anyone but host to finalize result if arbitration fails", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 0));

    await expect(
      gameResultCourt
        .connect(arbitrarySigner)
        .finalizeFailedArbitrationResult(0)
    ).to.be.reverted;
    await expect(
      gameResultCourt
        .connect(playerSigners[0])
        .finalizeFailedArbitrationResult(0)
    ).to.be.reverted;
  });

  it("should not allow finalizing failed arbitration result if already finalized", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 0));

    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod - 1);
    await gameResultCourt
      .connect(arbitrarySigner)
      .finalizeUnchallengedResult(1);

    await expect(
      gameResultCourt
        .connect(arbitrarySigner)
        .finalizeFailedArbitrationResult(0)
    ).to.be.reverted;
  });

  it("should not allow finalizing result if arbitration not requested or not failed", async function () {
    await gameResultCourt.connect(hostSigner).submitResultAsHost(winners);
    await expect(
      gameResultCourt
        .connect(arbitrarySigner)
        .finalizeFailedArbitrationResult(0)
    ).to.be.reverted;

    fakeArbitrator.createDispute.returns(5);
    await gameResultCourt.connect(playerSigners[0]).requestArbitration(0, 0);
    await expect(
      gameResultCourt
        .connect(arbitrarySigner)
        .finalizeFailedArbitrationResult(0)
    ).to.be.reverted;

    await expect(gameResultCourt.connect(fakeArbitrator.wallet).rule(5, 2));
    await expect(
      gameResultCourt
        .connect(arbitrarySigner)
        .finalizeFailedArbitrationResult(0)
    ).to.be.reverted;
  });

  //
  // getWinners
  //
  it("should return winners if finalized", async function () {
    const submitReceipt = await (
      await gameResultCourt.connect(hostSigner).submitResultAsHost(winners)
    ).wait();
    await mineUntil(submitReceipt.blockNumber + challengePeriod);
    await gameResultCourt.finalizeUnchallengedResult(0);
    expect(await gameResultCourt.getWinners()).to.eql(winners);
  });

  it("should not return winners if not finalized", async function () {
    await expect(gameResultCourt.getWinners()).to.be.reverted;
  });
});
