// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token with voting capabilities for governance
 * Implements delegation and snapshot mechanisms for proposal voting
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens

    constructor() ERC20("GovernanceToken", "GOV") ERC20Permit("GovernanceToken") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
