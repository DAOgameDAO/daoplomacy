// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

import {IArbitrable} from "@kleros/erc-792/contracts/IArbitrable.sol";
import {IArbitrator} from "@kleros/erc-792/contracts/IArbitrator.sol";

// GameResultCourt decides on the canonical outcome of a game. The game host or any player can
// submit a result. If it is not challenged by the host or any player, the result is considered
// final after a challenge period. If a player challenges a result, it is put on hold and an
// external arbitrator is called in to decide if the result should be finalized. If the host
// challenges a result, the result is put on hold in the same way, but arbitration has to be
// requested explicitly by a player.
contract GameResultCourt is IArbitrable {
    event ResultSubmitted(
        uint256 indexed resultID,
        address indexed sender,
        address[] winners
    );
    event ResultChallenged(uint256 indexed resultID, address indexed sender);
    event ArbitrationRequested(
        uint256 indexed resultID,
        uint256 indexed playerIndex,
        uint256 disputeID
    );
    event ResultFinalized(
        uint256 indexed resultID,
        address[] winners,
        bool arbitrated,
        bool arbitrationSuccessful
    );

    // ERC 1497 events
    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);
    event Evidence(
        Arbitrator indexed _arbitrator,
        uint256 indexed _evidenceGroupID,
        address indexed _party,
        string _evidence
    );
    event Dispute(
        Arbitrator indexed _arbitrator,
        uint256 indexed _disputeID,
        uint256 _metaEvidenceID,
        uint256 _evidenceGroupID
    );

    error NotHostError(address sender);
    error NotArbitratorError(address sender);
    error NotPlayerError(uint256 index, address sender);
    error ResultFinalizedError(uint256 resultID);
    error ResultNotFinalizedError();
    error ResultChallengedError(uint256 resultID, bool byHost, bool byPlayer);
    error ChallengePeriodNotOverError(
        uint256 resultID,
        uint256 submitBlockNumber,
        uint256 challengePeriod,
        uint256 blockNumber
    );
    error ChallengePeriodOverError(
        uint256 resultID,
        uint256 submitBlockNumber,
        uint256 challengePeriod,
        uint256 blockNumber
    );
    error ArbitrationAlreadyGivenError(uint256 resultID);
    error ArbitrationNotRequestedError(uint256 resultID);
    error ArbitrationNotGivenError(uint256 resultID);
    error ArbitrationNotRefusedError(uint256 resultID);

    struct Result {
        address[] winners;
        uint256 submitBlockNumber;
        bool challengedByHost;
        bool arbitrationRequested;
        bool arbitrationGiven;
        uint256 arbitrationRuling;
    }

    address public host;
    address[] public players;
    IArbitrator public arbitrator;
    uint256 public challengePeriodBlocks;

    Result[] public results;
    uint256 finalizedResultID;
    mapping(uint256 => uint256) public disputeIDToResultID;

    constructor(
        address _host,
        IArbitrator _arbitrator,
        uint256 _challengePeriodBlocks,
        address[] memory _players
    ) {
        host = _host;
        arbitrator = _arbitrator;
        challengePeriodBlocks = _challengePeriodBlocks;
        players = _players;

        // Use max instead of 0 to make sure first result is not automatically finalized.
        finalizedResultID = type(uint256).max;
    }

    function isFinalized() public view returns (bool) {
        return finalizedResultID != type(uint256).max;
    }

    function getWinners() external view returns (address[] memory) {
        if (!isFinalized()) {
            revert ResultNotFinalizedError();
        }
        return results[finalizedResultID].winners;
    }

    function submitResultAsHost(address[] memory winners) external {
        if (msg.sender != host) {
            revert NotHostError(msg.sender);
        }
        _submitResult(msg.sender, winners);
    }

    function submitResultAsPlayer(uint256 playerIndex, address[] memory winners)
        external
    {
        if (
            playerIndex >= players.length || msg.sender != players[playerIndex]
        ) {
            revert NotPlayerError(playerIndex, msg.sender);
        }
        _submitResult(msg.sender, winners);
    }

    function challengeResultAsHost(uint256 resultID) external {
        if (msg.sender != host) {
            revert NotHostError(msg.sender);
        }
        if (isFinalized()) {
            revert ResultFinalizedError(finalizedResultID);
        }

        Result memory result = results[resultID];
        if (block.number >= _computeFinalizationBlock(result)) {
            revert ChallengePeriodOverError(
                resultID,
                result.submitBlockNumber,
                challengePeriodBlocks,
                block.number
            );
        }
        if (result.challengedByHost) {
            revert ResultChallengedError(resultID, true, false);
        }
        if (result.arbitrationRequested) {
            revert ResultChallengedError(resultID, false, true);
        }

        result.challengedByHost = true;
        results[resultID] = result;

        emit ResultChallenged(resultID, msg.sender);
    }

    function requestArbitration(uint256 playerIndex, uint256 resultID)
        external
        payable
    {
        if (
            playerIndex >= players.length || msg.sender != players[playerIndex]
        ) {
            revert NotPlayerError(playerIndex, msg.sender);
        }
        if (isFinalized()) {
            revert ResultFinalizedError(finalizedResultID);
        }

        Result memory result = results[resultID];
        if (block.number >= _computeFinalizationBlock(result)) {
            revert ChallengePeriodOverError(
                resultID,
                result.submitBlockNumber,
                challengePeriodBlocks,
                block.number
            );
        }
        if (result.arbitrationRequested) {
            revert ResultChallengedError(resultID, false, true);
        }

        uint256 disputeID = arbitrator.createDispute{value: msg.value}(
            2,
            abi.encode(result.winners, result.submitBlockNumber)
        );

        result.arbitrationRequested = true;
        results[resultID] = result;
        disputeIDToResultID[disputeID] = resultID;

        emit ArbitrationRequested(resultID, playerIndex, disputeID);
    }

    function finalizeUnchallengedResult(uint256 resultID) external {
        if (isFinalized()) {
            revert ResultFinalizedError(finalizedResultID);
        }
        Result memory result = results[resultID];
        if (result.challengedByHost) {
            revert ResultChallengedError(resultID, true, false);
        }
        if (result.arbitrationRequested) {
            revert ResultChallengedError(resultID, false, true);
        }
        if (block.number < _computeFinalizationBlock(result)) {
            revert ChallengePeriodNotOverError(
                resultID,
                result.submitBlockNumber,
                challengePeriodBlocks,
                block.number
            );
        }
        finalizedResultID = resultID;

        emit ResultFinalized({
            resultID: resultID,
            winners: result.winners,
            arbitrated: false,
            arbitrationSuccessful: false
        });
    }

    function finalizeFailedArbitrationResult(uint256 resultID) external {
        if (msg.sender != host) {
            revert NotHostError(msg.sender);
        }
        if (isFinalized()) {
            revert ResultFinalizedError(finalizedResultID);
        }
        Result memory result = results[resultID];
        if (!result.arbitrationGiven) {
            revert ArbitrationNotGivenError(resultID);
        }
        if (result.arbitrationRuling != 0) {
            revert ArbitrationNotRefusedError(resultID);
        }
        finalizedResultID = resultID;
        emit ResultFinalized({
            resultID: resultID,
            winners: result.winners,
            arbitrated: true,
            arbitrationSuccessful: false
        });
    }

    function rule(uint256 _disputeID, uint256 _ruling) external {
        if (msg.sender != address(arbitrator)) {
            revert NotArbitratorError(msg.sender);
        }
        uint256 resultID = disputeIDToResultID[_disputeID];
        Result memory result = results[resultID];
        if (!result.arbitrationRequested) {
            revert ArbitrationNotRequestedError(resultID);
        }
        if (result.arbitrationGiven) {
            revert ArbitrationAlreadyGivenError(resultID);
        }
        result.arbitrationGiven = true;
        result.arbitrationRuling = _ruling;
        results[resultID] = result;

        emit Ruling(arbitrator, _disputeID, _ruling);
        if (!isFinalized() && result.arbitrationRuling == 1) {
            finalizedResultID = resultID;
            emit ResultFinalized({
                resultID: resultID,
                winners: result.winners,
                arbitrated: true,
                arbitrationSuccessful: true
            });
        }
    }

    function _submitResult(address sender, address[] memory winners) internal {
        if (isFinalized()) {
            revert ResultFinalizedError(finalizedResultID);
        }
        Result memory result = Result({
            winners: winners,
            submitBlockNumber: block.number,
            challengedByHost: false,
            arbitrationRequested: false,
            arbitrationGiven: false,
            arbitrationRuling: 0
        });
        uint256 resultID = results.length;
        results.push(result);

        emit ResultSubmitted({
            resultID: resultID,
            sender: sender,
            winners: winners
        });
    }

    function _computeFinalizationBlock(Result memory result)
        internal
        view
        returns (uint256)
    {
        return result.submitBlockNumber + challengePeriodBlocks;
    }
}
