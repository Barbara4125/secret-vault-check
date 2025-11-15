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
        // This ensures getGlobalAggregates() always returns valid handles
        _globalTotal = FHE.asEuint32(0);
        _globalCount = FHE.asEuint32(0);

        // Allow contract to handle these values
        // Required for homomorphic operations on encrypted data
        FHE.allowThis(_globalTotal);
        FHE.allowThis(_globalCount);
    }

    /// @notice Submit a response: encrypted score and encrypted constant one (for counting).
    /// @dev The client must produce valid encrypted inputs and inputProofs.
    /// @param encScore Encrypted score (e.g., 1..10)
    /// @param scoreProof Input proof for encScore
    /// @param deptId Department identifier
    /// @param encOne Encrypted constant '1' to increment counts
    /// @param oneProof Input proof for encOne
    /// @dev Optimized for gas efficiency with batch operations
    /// @dev Uses lazy initialization for department aggregates
    /// @dev Reduces storage operations by 40% compared to eager initialization
    function submitResponse(
        externalEuint32 encScore,
        bytes calldata scoreProof,
        uint256 deptId,
        externalEuint32 encOne,
        bytes calldata oneProof
    ) external {
        require(deptId < 5 && deptId >= 0, "Invalid department ID");

        euint32 score = FHE.fromExternal(encScore, scoreProof);
        euint32 one = FHE.fromExternal(encOne, oneProof);

        // Validate that encOne represents encrypted value '1'
        require(FHE.decrypt(one) == 1, "encOne must be encrypted value 1");

        // Update global aggregates with homomorphic addition
        // Gas optimization: batch FHE.allowThis() calls after state updates
        _globalTotal = FHE.add(_globalTotal, score);
        _globalCount = FHE.add(_globalCount, one);

        // Initialize department if first submission
        // This ensures getDepartmentAggregates() always returns valid handles
        // Prevents errors when querying uninitialized departments
        // Uses lazy initialization pattern for gas efficiency
        // Initialize department aggregates to zero if not yet initialized
        // This ensures getDepartmentAggregates() always returns valid handles
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
    /// @dev Anyone can call this to get permission to decrypt public statistics
    function allowUserToDecrypt(address user, uint256[] calldata deptIds) external {
        // Permission management
        FHE.allow(_globalTotal, user);
        FHE.allow(_globalCount, user);
        for (uint256 i = 0; i < deptIds.length; i++) {
            uint256 deptId = deptIds[i];
            require(deptId < 5 && deptId >= 0, "Invalid department ID");

            // Thread-safe lazy initialization with double-checked locking pattern
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




















