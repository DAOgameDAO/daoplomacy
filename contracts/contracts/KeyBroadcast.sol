// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

interface AddrsSeq {
    function at(uint64 n, uint64 i) external view returns (address);
}

contract KeyBroadcast {
    event EonKey(uint64 activationBlockNumber, bytes key, address keyper);
    event DecryptionKey(bytes8 epochID, bytes key, address keyper);
    error SenderNotKeyper();

    AddrsSeq public keypers;

    constructor(AddrsSeq _keypers) {
        keypers = _keypers;
    }

    function broadcastEonKey(
        uint64 n,
        uint64 i,
        uint64 activationBlockNumber,
        bytes calldata key
    ) external {
        if (msg.sender == keypers.at(n, i)) {
            revert SenderNotKeyper();
        }
        emit EonKey({
            activationBlockNumber: activationBlockNumber,
            key: key,
            keyper: msg.sender
        });
    }

    function broadcastDecryptionKey(
        uint64 n,
        uint64 i,
        bytes8 epochID,
        bytes calldata k
    ) external {
        if (msg.sender == keypers.at(n, i)) {
            revert SenderNotKeyper();
        }
        emit DecryptionKey({epochID: epochID, key: k, keyper: msg.sender});
    }
}
