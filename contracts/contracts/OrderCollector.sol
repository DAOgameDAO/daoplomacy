// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

import {BatchCounter} from "./BatchCounter.sol";

contract OrderCollector {
    error OrderLimitExceededError(address sender, uint256 batchIndex);
    error WrongBatchIndexError(uint256 batchIndex, uint256 currentBatchIndex);

    event EncryptedOrderSubmitted(
        uint256 batchIndex,
        address sender,
        bytes encryptedOrder
    );

    BatchCounter public batchCounter;
    mapping(address => uint256) public orderLimits; // sender => max num txs
    mapping(uint256 => mapping(address => uint256)) public numOrders; // batch index => sender => num txs

    constructor(
        BatchCounter _batchCounter,
        address[] memory players,
        uint256 orderLimit
    ) {
        batchCounter = _batchCounter;

        // number of players is small, so iterating is fine
        for (uint256 i = 0; i < players.length; i++) {
            orderLimits[players[i]] = orderLimit;
        }
    }

    function submitEncryptedOrder(
        uint256 batchIndex,
        bytes memory encryptedOrder
    ) external {
        if (batchIndex != batchCounter.currentBatchIndex()) {
            revert WrongBatchIndexError(
                batchIndex,
                batchCounter.currentBatchIndex()
            );
        }
        if (numOrders[batchIndex][msg.sender] >= orderLimits[msg.sender]) {
            revert OrderLimitExceededError(msg.sender, batchIndex);
        }
        numOrders[batchIndex][msg.sender]++;

        emit EncryptedOrderSubmitted({
            batchIndex: batchIndex,
            sender: msg.sender,
            encryptedOrder: encryptedOrder
        });
    }
}
