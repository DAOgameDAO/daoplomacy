import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const players = process.env.PLAYERS?.split(",");
  const orderLimit = process.env.ORDER_LIMIT;

  const batchCounter = await deployments.get("BatchCounter");

  await deploy("OrderCollector", {
    from: deployer,
    args: [batchCounter.address, players, orderLimit],
    log: true,
  });
};

export default func;
func.tags = ["OrderCollector"];
func.dependencies = ["BatchCounter"];
