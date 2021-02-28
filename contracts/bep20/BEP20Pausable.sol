// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.6.12;

import "./BEP20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

abstract contract BEP20Pausable is BEP20, Pausable {
    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(!paused(), "BEP20Pausable: token transfer while paused");
    }
}
