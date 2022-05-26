// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

contract FakeZeroEx {
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function fakeSwap(uint256 wantedETH) public payable {
        payable(msg.sender).transfer(wantedETH);
    }
}
