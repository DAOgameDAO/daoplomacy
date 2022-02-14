// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

contract Application {
    event ApplicationSubmitted(address sender, string applicationIpfsCid);

    function submitApplication(string calldata applicationIpfsCid) external {
        emit ApplicationSubmitted(msg.sender, applicationIpfsCid);
    }
}
