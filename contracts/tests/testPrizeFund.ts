import { ethers } from "hardhat";
import { Signer } from "ethers";
import chai from "chai";
import { expect } from "chai";
import { smock } from "@defi-wonderland/smock";

chai.use(smock.matchers);

describe("GameResultCourt", function () {
  let signers: Signer[];
  let winnerSigners: Signer[];
  let winnerAddresses: string[];
  let arbitrarySigner: Signer;

  let mockGameResultCourt: any;
  let testERC20Factory: any;
  let testERC20: any;
  let prizeFundFactory: any;
  let prizeFund: any;

  before(async function () {
    signers = await ethers.getSigners();
    winnerSigners = signers.slice(1, 4);
    winnerAddresses = await Promise.all(
      winnerSigners.map((s) => s.getAddress())
    );
    arbitrarySigner = signers[4];

    testERC20Factory = await ethers.getContractFactory("TestERC20");
    prizeFundFactory = await ethers.getContractFactory("PrizeFund");
  });

  beforeEach(async function () {
    const gameResultCourtFactory = await ethers.getContractFactory(
      "GameResultCourt"
    );
    mockGameResultCourt = await smock.fake(gameResultCourtFactory);
    mockGameResultCourt.getWinners.returns(winnerAddresses);

    testERC20 = await testERC20Factory.deploy();
    prizeFund = await prizeFundFactory.deploy(mockGameResultCourt.address);

    await testERC20.mint(prizeFund.address, 1000);
  });

  it("should distribute funds equally to winnerAddresses", async function () {
    await expect(
      prizeFund
        .connect(winnerSigners[0])
        .payout(testERC20.address, 0, winnerAddresses[0])
    )
      .to.emit(prizeFund, "PaidOut")
      .withArgs(
        0,
        winnerAddresses[0],
        testERC20.address,
        winnerAddresses[0],
        333
      )
      .to.emit(testERC20, "Transfer")
      .withArgs(prizeFund.address, winnerAddresses[0], 333);
    expect(await testERC20.balanceOf(prizeFund.address)).to.equal(667);
    expect(await testERC20.balanceOf(winnerAddresses[0])).to.equal(333);

    await expect(
      prizeFund
        .connect(winnerSigners[2])
        .payout(testERC20.address, 2, winnerAddresses[2])
    )
      .to.emit(prizeFund, "PaidOut")
      .withArgs(
        2,
        winnerAddresses[2],
        testERC20.address,
        winnerAddresses[2],
        333
      )
      .to.emit(testERC20, "Transfer")
      .withArgs(prizeFund.address, winnerAddresses[2], 333);
    expect(await testERC20.balanceOf(prizeFund.address)).to.equal(334);
    expect(await testERC20.balanceOf(winnerAddresses[2])).to.equal(333);

    // winner 1 decides to pay to winner 2
    await expect(
      prizeFund
        .connect(winnerSigners[1])
        .payout(testERC20.address, 1, winnerAddresses[2])
    )
      .to.emit(prizeFund, "PaidOut")
      .withArgs(
        1,
        winnerAddresses[1],
        testERC20.address,
        winnerAddresses[2],
        333
      )
      .to.emit(testERC20, "Transfer")
      .withArgs(prizeFund.address, winnerAddresses[2], 333);
    expect(await testERC20.balanceOf(prizeFund.address)).to.equal(1);
    expect(await testERC20.balanceOf(winnerAddresses[1])).to.equal(0);
    expect(await testERC20.balanceOf(winnerAddresses[2])).to.equal(666);
  });

  it("should not pay out to non winner", async function () {
    await expect(
      prizeFund
        .connect(arbitrarySigner)
        .payout(testERC20.address, 0, winnerAddresses[0])
    ).to.be.reverted;
    await expect(
      prizeFund
        .connect(winnerSigners[0])
        .payout(testERC20.address, 1, winnerAddresses[0]) // wrong index
    ).to.be.reverted;
  });

  it("should not pay out twice to same winner", async function () {
    await prizeFund
      .connect(winnerSigners[0])
      .payout(testERC20.address, 0, winnerAddresses[0]);
    await expect(
      prizeFund
        .connect(winnerSigners[0])
        .payout(testERC20.address, 0, winnerAddresses[0])
    ).to.be.reverted;
  });

  it("should not change payout amount when topped up after first payout", async function () {
    await prizeFund
      .connect(winnerSigners[0])
      .payout(testERC20.address, 0, winnerAddresses[0]);
    await testERC20.mint(prizeFund.address, 1000);

    await expect(
      prizeFund
        .connect(winnerSigners[1])
        .payout(testERC20.address, 1, winnerAddresses[1])
    )
      .to.emit(prizeFund, "PaidOut")
      .withArgs(
        1,
        winnerAddresses[1],
        testERC20.address,
        winnerAddresses[1],
        333
      )
      .to.emit(testERC20, "Transfer")
      .withArgs(prizeFund.address, winnerAddresses[1], 333);
    expect(await testERC20.balanceOf(prizeFund.address)).to.equal(1334);
    expect(await testERC20.balanceOf(winnerAddresses[1])).to.equal(333);
  });

  it("should not pay out when game not finished yet", async function () {
    mockGameResultCourt.getWinners.reverts();
    await expect(
      prizeFund
        .connect(winnerSigners[0])
        .payout(testERC20.address, 0, winnerAddresses[0])
    ).to.be.reverted;
  });
});
