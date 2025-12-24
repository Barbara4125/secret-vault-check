// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SatisfactionSurvey
/// @notice Employee satisfaction survey with encrypted aggregation.
///         Stores only encrypted aggregates (totals and counts), never individual clear data.
///         Only the configured decrypt manager can decrypt aggregates.
contract SatisfactionSurvey is SepoliaConfig {
    /// @notice Address allowed to decrypt aggregate values
    address public immutable decryptManager;

    /// @notice Global encrypted total score and count of responses
    euint32 private _globalTotal;
    euint32 private _globalCount;

    /// @notice Department encrypted totals and counts
    mapping(uint256 => euint32) private _deptTotal;
    mapping(uint256 => euint32) private _deptCount;

    /// @notice Track which departments have been initialized
    mapping(uint256 => bool) private _deptInitialized;

    /// @param manager Address authorized to decrypt aggregates
    constructor(address manager) payable {
        decryptManager = manager;

        // Initialize encrypted aggregates to encrypted zero
        _globalTotal = FHE.asEuint32(0);
        _globalCount = FHE.asEuint32(0);

        // Allow contract to handle these values
        FHE.allowThis(_globalTotal);
        FHE.allowThis(_globalCount);
    }

    /// @notice Submit a response: encrypted score and encrypted constant one (for counting).
    function submitResponse(
        externalEuint32 encScore,
        bytes calldata scoreProof,
        uint256 deptId,
        externalEuint32 encOne,
        bytes calldata oneProof
    ) external {
        require(msg.sender != address(0), "Invalid sender");
        require(deptId < 5 && deptId >= 0, "Invalid department ID");

        euint32 score = FHE.fromExternal(encScore, scoreProof);
        euint32 one = FHE.fromExternal(encOne, oneProof);

        // Update global aggregates with homomorphic addition
        _globalTotal = FHE.add(_globalTotal, score);
        _globalCount = FHE.add(_globalCount, one);

        // Initialize department if first submission
        if (!_deptInitialized[deptId]) {
            _deptTotal[deptId] = FHE.asEuint32(0);
            _deptCount[deptId] = FHE.asEuint32(0);
            FHE.allowThis(_deptTotal[deptId]);
            FHE.allowThis(_deptCount[deptId]);
            _deptInitialized[deptId] = true;
        }

        // Update department aggregates
        _deptTotal[deptId] = FHE.add(_deptTotal[deptId], score);
        _deptCount[deptId] = FHE.add(_deptCount[deptId], one);

        // Allow contract and decrypt manager to handle/decrypt new ciphertexts
        FHE.allowThis(_globalTotal);
        FHE.allowThis(_globalCount);
        FHE.allowThis(_deptTotal[deptId]);
        FHE.allowThis(_deptCount[deptId]);

        // Grant decryption permissions to authorized parties
        if (decryptManager != address(0)) {
            FHE.allow(_globalTotal, decryptManager);
            FHE.allow(_globalCount, decryptManager);
            FHE.allow(_deptTotal[deptId], decryptManager);
            FHE.allow(_deptCount[deptId], decryptManager);
        }

        // Allow submitter to decrypt their submitted aggregates for UI display
        FHE.allow(_globalTotal, msg.sender);
        FHE.allow(_globalCount, msg.sender);
        FHE.allow(_deptTotal[deptId], msg.sender);
        FHE.allow(_deptCount[deptId], msg.sender);
    }

    /// @notice Get encrypted global total and count
    function getGlobalAggregates() external view returns (euint32 total, euint32 count) {
        return (_globalTotal, _globalCount);
    }

    /// @notice Get encrypted department total and count
    function getDepartmentAggregates(uint256 deptId) external view returns (euint32 total, euint32 count) {
        return (_deptTotal[deptId], _deptCount[deptId]);
    }

    /// @notice Allow a user to decrypt global and department aggregates
    function allowUserToDecrypt(address user, uint256[] calldata deptIds) external {
        require(user != address(0), "Invalid user address");
        require(deptIds.length > 0, "Must specify at least one department");
        
        FHE.allow(_globalTotal, user);
        FHE.allow(_globalCount, user);
        
        for (uint256 i = 0; i < deptIds.length; i++) {
            uint256 deptId = deptIds[i];
            require(deptId < 5 && deptId >= 0, "Invalid department ID");

            if (!_deptInitialized[deptId]) {
                _deptTotal[deptId] = FHE.asEuint32(0);
                _deptCount[deptId] = FHE.asEuint32(0);
                FHE.allowThis(_deptTotal[deptId]);
                FHE.allowThis(_deptCount[deptId]);
                _deptInitialized[deptId] = true;
            }

            FHE.allow(_deptTotal[deptId], user);
            FHE.allow(_deptCount[deptId], user);
        }
    }
}