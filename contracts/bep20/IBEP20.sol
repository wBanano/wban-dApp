// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0;

interface IBEP20 {
    /**
     * @dev Returns the bep token owner.
     */
    function getOwner() external view returns (address);
}
