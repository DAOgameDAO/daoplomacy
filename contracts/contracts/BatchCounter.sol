// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

contract BatchCounter {
    error StartBlockNotReachedError(
        uint256 startBlockNumber,
        uint256 currentBlockNumber
    );

    uint256 public startBlockNumber;
    uint256 public batchLength;

    constructor(uint256 _startBlockNumber, uint256 _batchLength) {
        startBlockNumber = _startBlockNumber;
        batchLength = _batchLength;
    }

    function hasStartedAtBlock(uint256 blockNumber) public view returns (bool) {
        return blockNumber >= startBlockNumber;
    }

    function batchStartBlock(uint256 batchIndex) public view returns (uint256) {
        return startBlockNumber + batchIndex * batchLength;
    }

    function batchIndexForBlock(uint256 blockNumber)
        public
        view
        returns (uint256)
    {
        if (blockNumber < startBlockNumber) {
            revert StartBlockNotReachedError(startBlockNumber, blockNumber);
        }
        return (blockNumber - startBlockNumber) / batchLength;
    }

    function hasStarted() external view returns (bool) {
        return hasStartedAtBlock(block.number);
    }

    function currentBatchIndex() external view returns (uint256) {
        return batchIndexForBlock(block.number);
    }

    function currentBatchStartBlock() external view returns (uint256) {
        return batchStartBlock(block.number); // I don't understand this
    }
}
