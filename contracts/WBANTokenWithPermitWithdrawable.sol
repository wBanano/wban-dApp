// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

import "./WBANTokenWithPermit.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/**
 * wBAN token with mints and burns controlled by the bridge.
 *
 * @dev this version introduces the ability to a `WITHDRAWER_ROLE` user
 * to remove tokens sent to this contract inadvertently.
 *
 * @author Wrap That Potassium <wrap-that-potassium@protonmail.com>
 */
contract WBANTokenWithPermitWithdrawable is WBANTokenWithPermit {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event WithdrawLockedTokens(address indexed to, address indexed token, uint256 amount);

    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    function withdrawUnexpectedTokens(IERC20Upgradeable token) external onlyRole(WITHDRAWER_ROLE) {
        uint256 amount = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, amount);
        emit WithdrawLockedTokens(msg.sender, address(token), amount);
    }
}
