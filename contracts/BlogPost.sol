// contracts/BlogPost.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract BlogPost is Initializable, OwnableUpgradeable, PausableUpgradeable {
    struct Post {
        uint256 id;
        address author;
        string contentHash;
        uint256 timestamp;
        bool isTokenGated;
        uint256 tipAmount;
    }

    mapping(uint256 => Post) public posts;
    uint256 private postCount;

    event PostCreated(uint256 indexed postId, address indexed author, string contentHash);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __Pausable_init();
        postCount = 0;
    }

    // Your existing functions here...
    
    // New upgrade functions can be added here
    function version() public pure returns (string memory) {
        return "1.0.0";
    }
}
