// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

import "./WBANTokenWithPermit.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract WBANGaslessSwap is AccessControlUpgradeable {
    using SafeERC20Upgradeable for WBANTokenWithPermit;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    WBANTokenWithPermit public wBAN;
    address payable public swapTarget;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @param _wBAN the address of wBAN contract
     * @param _swapTarget the 0x `to` field from the API response
     */
    function initialize(address _wBAN, address payable _swapTarget) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        wBAN = WBANTokenWithPermit(_wBAN);
        swapTarget = _swapTarget;
    }

    /**
     * Gasless swap wBAN -> ETH.
     *
     * @param recipient the seller (wBAN)
     * @param sellAmount how many wBAN to sell
     * @param deadline the permit deadline
     * @param v the v value of the permit signature
     * @param r the r value of the permit signature
     * @param s the s value of the permit signature
     * @param swapCallData the 0x `data` field from the API response
     */
    function swapWBANToCrypto(
        address payable recipient,
        uint256 sellAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes calldata swapCallData
    ) external payable onlyRole(RELAYER_ROLE) {
        require(address(this).balance == 0, "Contract balance should be 0");

        // use permit approval
        wBAN.permit(recipient, address(this), sellAmount, deadline, v, r, s);

        // transfer `recipient` wBAN to this contract -- assumes the user has given proper allowance
        wBAN.safeTransferFrom(recipient, address(this), sellAmount);

        // Give `spender` an infinite allowance to spend this contract's `sellToken`.
        // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
        // allowance to 0 before being able to update it.
        wBAN.approve(swapTarget, type(uint256).max);

        // Call the encoded swap function call on the contract at `swapTarget`,
        // passing along any ETH attached to this function call to cover protocol fees.
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = swapTarget.call{value: msg.value}(swapCallData);
        require(success, "SWAP_CALL_FAILED");

        // ensure ETH balance was increased
        require(address(this).balance > 0, "Invalid output token");

        // Send ETH to `recipient`
        recipient.transfer(address(this).balance);
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}
}
