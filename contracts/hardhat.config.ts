import * as dotenv from "dotenv";
dotenv.config();

import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import * as csv from "csv-parse/sync";
import * as fs from "fs";
import { execSync } from "child_process";

import { mineUntil } from "./utils/mining";

task("players", "Print the player accounts as configured in hardhat").setAction(
  async (_, hre) => {
    const names = [
      "player1",
      "player2",
      "player3",
      "player4",
      "player5",
      "player6",
      "player7",
    ];
    for (const name of names) {
      const signer = await hre.ethers.getNamedSigner(name);
      console.log(name + ": " + (await signer.getAddress()));
    }
  }
);

task("batch-status", "Print the progress of the batch counter").setAction(
  async (_, hre) => {
    const batchCounter = await hre.ethers.getContract("BatchCounter");

    const block = await hre.ethers.provider.getBlockNumber();
    const batch = await batchCounter.batchIndexForBlock(block);
    const batchStartBlock = await batchCounter.batchStartBlock(batch);
    const batchEndBlock = (
      await batchCounter.batchStartBlock(batch.add(1))
    ).sub(1);
    const startBlock = await batchCounter.startBlockNumber();
    const batchLength = await batchCounter.batchLength();

    console.log("            Current block:", block);
    console.log("            Current batch:", batch.toString());
    console.log("     First block in batch:", batchStartBlock.toString());
    console.log("      Last block in batch:", batchEndBlock.toString());
    console.log("Remaining blocks in batch:", batchEndBlock - block);
    console.log("  First batch start block:", startBlock.toString());
    console.log("             Batch length:", batchLength.toString());
  }
);

task("send-order", "Send an order")
  .addParam("player", "The index of the player")
  .addParam("order", "The order to send")
  .addParam("batch", "The batch in which to include the order")
  .setAction(async (args, hre) => {
    const signer = await hre.ethers.getNamedSigner(args.player);
    const orderCollector = await hre.ethers.getContract(
      "OrderCollector",
      signer
    );

    const tx = await orderCollector.submitEncryptedOrder(
      args.batch,
      args.order
    );
    await tx.wait();
  });

task("send-many-orders", "Send orders from a CSV file")
  .addParam("file", "The CSV file defining the orders")
  .addParam("eonkey", "The hex encoded eon key")
  .setAction(async (args, hre) => {
    const orderCollector = await hre.ethers.getContract("OrderCollector");
    const batchCounter = await hre.ethers.getContract("BatchCounter");

    const content = fs.readFileSync(args.file, "ascii");
    const records = csv.parse(content);

    const startBlockNumber = await batchCounter.startBlockNumber();
    await mineUntil(startBlockNumber);

    for (const [i, record] of records.entries()) {
      const batchIndex = parseInt(record[0]);
      const signer = await hre.ethers.getNamedSigner(record[1]);
      const order = record[2];
      const epoch = "0x" + batchIndex.toString(16).padStart(16, "0");

      const encryptCmd = [
        "rolling-shutter crypto encrypt",
        "--eon-key",
        args.eonkey,
        "--epoch-id",
        epoch,
        '"' + order + '"',
      ].join(" ");
      const encryptedOrder = execSync(encryptCmd).toString().trim();

      const currentBatchIndex = await batchCounter.currentBatchIndex();
      if (currentBatchIndex > batchIndex) {
        console.log("batch", batchIndex, "has already passed");
        return;
      }
      if (currentBatchIndex < batchIndex) {
        const batchStartBlock = await batchCounter.batchStartBlock(batchIndex);
        await mineUntil(batchStartBlock - 1);
      }

      console.log("submitting order", i + 1, "of", records.length);
      await orderCollector
        .connect(signer)
        .submitEncryptedOrder(batchIndex, encryptedOrder);
    }

    if (records.length >= 1) {
      const lastRecord = records[records.length - 1];
      const lastBatchIndex = parseInt(lastRecord[0]);
      const nextBatchStartBlock = await batchCounter.batchStartBlock(
        lastBatchIndex + 1
      );
      await mineUntil(nextBatchStartBlock);
    }
  });

task("close-batch", "Mine until the end of the current batch").setAction(
  async (_, hre) => {
    const batchCounter = await hre.ethers.getContract("BatchCounter");

    let nextBatchIndex;
    const hasStarted = await batchCounter.hasStarted();
    if (!hasStarted) {
      nextBatchIndex = 0;
    } else {
      const batchIndex = await batchCounter.currentBatchIndex();
      nextBatchIndex = batchIndex.add(1);
    }
    const nextBatchStartBlock = await batchCounter.batchStartBlock(
      nextBatchIndex
    );

    console.log(
      "mining until block",
      nextBatchStartBlock.toString(),
      "to finish batch",
      (nextBatchIndex - 1).toString()
    );
    await mineUntil(nextBatchStartBlock);
  }
);

module.exports = {
  solidity: {
    version: "0.8.9",
  },
  paths: {
    tests: "./tests",
  },
  networks: {
    gnosis: {
      url: "https://rpc.gnosischain.com/",
      accounts: [""],
    },
  },
  namedAccounts: {
    deployer: {
      31337: 0,
      100: 0,
    },
    shutterExecutor: {
      31337: 1,
    },
    player1: {
      31337: 2,
    },
    player2: {
      31337: 3,
    },
    player3: {
      31337: 4,
    },
    player4: {
      31337: 5,
    },
    player5: {
      31337: 6,
    },
    player6: {
      31337: 7,
    },
    player7: {
      31337: 8,
    },
  },
};
