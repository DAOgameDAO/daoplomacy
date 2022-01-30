// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

import {GameResultCourt} from "./GameResultCourt.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PrizeFund {
    using SafeERC20 for IERC20;

    event PaidOut(
        uint256 winnerIndex,
        address winner,
        IERC20 token,
        address receiver,
        uint256 amount
    );

    error ResultNotFinalizedError();
    error AlreadyPaidOutError(address tokenAddress, uint256 winnerIndex);
    error NotWinnerError(uint256 index, address sender);
    error NothingToPayOutError(IERC20 token);

    GameResultCourt public resultCourt;
    mapping(IERC20 => uint256) amountsToDistribute; // token => amount
    mapping(IERC20 => mapping(uint256 => bool)) paidOut; // token => winnerIndex => paid out or not

    constructor(GameResultCourt _resultCourt) {
        resultCourt = _resultCourt;
    }

    function payout(
        IERC20 token,
        uint256 winnerIndex,
        address receiver
    ) external {
        if (resultCourt.isFinalized()) {
            revert ResultNotFinalizedError();
        }
        address[] memory winners = resultCourt.getWinners();
        if (
            winners.length <= winnerIndex || winners[winnerIndex] != msg.sender
        ) {
            revert NotWinnerError(winnerIndex, msg.sender);
        }
        if (paidOut[token][winnerIndex]) {
            revert AlreadyPaidOutError(address(0), winnerIndex);
        }

        if (amountsToDistribute[token] == 0) {
            amountsToDistribute[token] = token.balanceOf(address(this));
        }
        if (amountsToDistribute[token] == 0) {
            revert NothingToPayOutError(token);
        }
        uint256 amountToSend = amountsToDistribute[token] / winners.length;
        paidOut[token][winnerIndex] = true;

        token.safeTransfer(receiver, amountToSend);

        emit PaidOut({
            winnerIndex: winnerIndex,
            winner: winners[winnerIndex],
            token: token,
            receiver: receiver,
            amount: amountToSend
        });
    }
}
