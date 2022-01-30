// SPDX-License-Identifier: MIT

// not used at the moment

pragma solidity =0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BatchCounter} from "./BatchCounter.sol";

contract RoleManager is Ownable {
    event Appointed(
        address account,
        Role role,
        uint256 province,
        uint256 startBatchIndex
    );
    event Dismissed(address account, uint256 endBatchIndex);

    error AccountExistsError(address account);
    error AccountNotExistsError(address account);
    error EndBeforeStartBatchIndexError(
        uint256 startBatchIndex,
        uint256 endBatchIndex
    );
    error PastBatchIndexError(uint256 batchIndex, uint256 currentBatchIndex);
    error RoleIsNoneError();
    error ProvinceOutOfRangeError(uint256 province);

    enum Role {
        None,
        CommanderInChief,
        General,
        Admiral,
        Governor
    }

    struct Account {
        bool exists;
        Role role;
        uint256 province;
        uint256 startBatchIndex;
        uint256 endBatchIndex; // inclusive
    }

    uint256 constant numProvinces = 75;

    BatchCounter public batchCounter;
    mapping(address => Account) public accounts;

    constructor(BatchCounter _batchCounter) Ownable() {
        batchCounter = _batchCounter;
    }

    function roleAndProvince(address account, uint256 batchIndex)
        external
        view
        returns (Role, uint256)
    {
        Account memory acc = accounts[account];
        if (!acc.exists) {
            return (Role.None, 0);
        }
        if (
            batchIndex < acc.startBatchIndex || batchIndex > acc.endBatchIndex
        ) {
            return (Role.None, 0);
        }
        return (acc.role, acc.province);
    }

    function appointNonGovernor(
        uint256 startBatchIndex,
        address account,
        Role role
    ) external onlyOwner {
        _appoint(startBatchIndex, account, role, 0);
    }

    function appointGovernor(
        uint256 startBatchIndex,
        address account,
        uint256 province
    ) external onlyOwner {
        _appoint(startBatchIndex, account, Role.Governor, province);
    }

    function dismiss(address account, uint256 endBatchIndex)
        external
        onlyOwner
    {
        Account memory acc = accounts[account];
        if (!acc.exists) {
            revert AccountNotExistsError(account);
        }
        if (endBatchIndex < acc.startBatchIndex) {
            revert EndBeforeStartBatchIndexError(
                endBatchIndex,
                acc.startBatchIndex
            );
        }
        if (
            batchCounter.hasStarted() &&
            endBatchIndex <= batchCounter.currentBatchIndex()
        ) {
            revert PastBatchIndexError(
                endBatchIndex,
                batchCounter.currentBatchIndex()
            );
        }
        acc.endBatchIndex = endBatchIndex;
        accounts[account] = acc;
        emit Dismissed({account: account, endBatchIndex: acc.endBatchIndex});
    }

    function _appoint(
        uint256 startBatchIndex,
        address account,
        Role role,
        uint256 province
    ) internal {
        if (role == Role.None) {
            revert RoleIsNoneError();
        }
        if (accounts[account].exists) {
            revert AccountExistsError(account);
        }
        if (
            batchCounter.hasStarted() &&
            startBatchIndex < batchCounter.currentBatchIndex()
        ) {
            revert PastBatchIndexError(
                startBatchIndex,
                batchCounter.currentBatchIndex()
            );
        }
        if (province >= numProvinces) {
            revert ProvinceOutOfRangeError(province);
        }

        Account memory acc = Account({
            exists: true,
            role: role,
            province: province,
            startBatchIndex: startBatchIndex,
            endBatchIndex: type(uint256).max
        });
        accounts[account] = acc;

        emit Appointed({
            account: account,
            role: acc.role,
            province: acc.province,
            startBatchIndex: acc.startBatchIndex
        });
    }
}
