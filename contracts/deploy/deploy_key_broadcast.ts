import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const addrsSeq = process.env.KEYPERS_ADDRS_SEQ_ADDRESS;

  await deploy("KeyBroadcast", {
    from: deployer,
    args: [addrsSeq],
    log: true,
  });
};

export default func;
func.tags = ["KeyBroadcast"];
