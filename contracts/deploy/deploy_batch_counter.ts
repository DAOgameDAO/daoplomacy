import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const startBlock = process.env.BATCH_COUNTER_START_BLOCK;
  const batchLength = process.env.BATCH_COUNTER_BATCH_LENGTH;

  await deploy("BatchCounter", {
    from: deployer,
    args: [startBlock, batchLength],
    log: true,
  });
};

export default func;
func.tags = ["BatchCounter"];
