# v1.5.0
- Deployment on Fantom

# v1.4.0
## New Features
- Embedded swaps with the help of 0x protocol #88
## Changes
- Polygon SushiSwap wBAN-WETH farms extended to 2022-03-26 3PM UTC.

# v1.3.1
## Changes
- Polygon SushiSwap wBAN-WETH farms extended to 2022-02-26 3PM UTC.

# v1.3.0
## Improvements
- New Web3 wallet provider #82
- Support for WalletConnect #77
- New setup page #81
- Display warning about blockchain fees is (un)wrapping up to 100 BAN #87
- Blacklist known BAN wallets used by exchanges #80
- Add link to NFT page #83
- Add Discord & Telegram links #25
- Add a link to GitBook documentation #47
## Bugs
- Welcome page - layout issue for BSC #84
- Missing crypto dialog not entirely visible on mobile #86

# v1.2.3
## Improvements
- Refresh button on farm #73
## Fixes
- Links to Polygon explorer don't work #78
- Action names not visible on mobile #76
## Changes
- Polygon SushiSwap wBAN-WETH farms extended to 2022-01-29 3PM UTC.

# v1.2.2
## New Features
- New page allowing to claim airdropped NFTs

# v1.2.1
## Changes
- Polygon SushiSwap wBAN-WETH farms extended to 2022-01-01 3PM UTC.

# v1.2.0
## Fixes
- New wrapping algorithm
## Changes
- Polygon SushiSwap wBAN-WETH farm extended to 2021-12-04 3PM UTC.

# v1.1.9
## Fixes
- Temporary switch to CoinGecko prices until the bridge is back online.

# v1.1.8
## Improvements
- Improve QR-Code scans by Kalium #74

# v1.1.7
## New Features
- New page allowing to blend airdropped NFTs

# v1.1.6
## Changes
- BSC PancakeSwap wBAN-BUSD farm extended to 2021-11-20 3PM UTC.

# v1.1.5
## Changes
- Polygon SushiSwap wBAN-WETH farms extended to 2021-11-06 3PM UTC.
## Improvements
- Copied harvest info to supply/withdrawal dialogs #72

# v1.1.4
- Introduced new wBAN-BUSD farm on PancakeSwap

# v1.1.3
## Improvements
- Binance Smart Chain bridge use the same codebase now!

# v1.1.2
## Improvements
- Change default Matic RPC endpoint #71
- Give users notice that adding additional funds to a farm will trigger a harvest #70

# v1.1.1
## Improvements
- Lower MATIC balance requirement #68
## Bugs fixed
- Polygon version: replace BSC logo in top bar with Polygon one #69

# v1.1.0
- Deployment on Polygon

# v1.0.11
## Changes
- wBAN-BNB and wBAN-BUSD farms extended to 2021-09-25 3PM UTC.

# v1.0.10
## Changes
- Changed maintenance messages and banner background.

# v1.0.9
## Changes
- wBAN-BNB and wBAN-BUSD farms extended to 2021-08-28 3PM UTC.

# v1.0.8
## Improvements
- Don't check BNB balance of user for unwraps #66

# v1.0.7
## Improvements
- Fetch wBAN and BNB prices from ApeSwap instead of CoinGecko #64

# v1.0.6
## Improvements
- Manage ended farms #62

# v1.0.5
## Changes
- Farms extended to 2021-07-31 3PM UTC.

# v1.0.4
## Improvements
- History button should have a label and a better tooltip #56
- Warn the user to not deposit more than 2 decimals #54
- Check BNB balance before a wrap #55
- Swap buttons and mainnet message #57
- Warn user to install MetaMask or use a compatible wallet #60

# v1.0.3
## Improvements
- Load prices from CoinGecko instead of PancakeSwap API #59

# v1.0.2
## Improvements
- Disable swap button if user has not at least 0.0006 BNB

# v1.0.1
## Improvements
- Rounding of deposit values
- Rounding of wBAN staking TVL
## Bugs fixed
- APR computations
- BAN price shouldn't be set to zero

# v0.7.4
## Improvements
- Remove time left value from all farms #46
## Bugs fixed
- Add a link to "wBAN Swaps" in burger menu #48
- Rounding error when clicking on "Max" #49

# v0.7.3
## Improvements
- Auto-reconnect with web3 provider on page reload + fix farms page reload #44

# v0.7.2
## Improvements
- Add swaps button with direct link to DEX #41
- For each farm, add a link to supply liquidity in the associated pool #42
## Bugs fixed
- Problem with farm page when reloading page #38
- "Max" links should put values rounded to two decimals #40

# v0.7.1
## Improvements
- Farm UX redesign #35
## Bugs fixed
- Farm: time left should be 0 and not increasing when the farm is done #32
- Farm: APR should be 0 when the farm ended or the allocation points are zero #33
- Add link to "Staking/Farming" page in the burger menu for mobiles #34

# v0.7.0
## New Features
- wBAN farms #29

# v0.6.1
## Bugs fixed
- Concurrency issues with pending withdrawals
- Routing error in JavaScript console #26

# v0.6.0
## New Features
- New smart-contract not requiring BNB deposits #23
- New page displaying history of deposits/withdrawals/swaps #20
## Improvements
- Display BAN price #11
- Add info symbols/buttons (i) tooltips to crypto vocabulary like total supply #19
- Notifications should timeout after 20 seconds #21
## Bugs fixed
- Can't make withdrawals/swaps with decimals and less than 1 (w)BAN #1
- Pending withdrawals job not processing all of them

# v0.5.0
## New Features
- Smart-contracts upgradeability #14
- Mobile compatibility and design improvements #9
## Improvements
- Logo in the top left corner should redirect to the swap page #6
- A big "connect" button should be added in the welcome page #5
- Version displayed in the toolbar should be linked to the changelog #3

# v0.4.3
## Improvements
- Setup page (accounts linking) should have a "copy BAN address button" #7
- BAN address in the setup page should be validated #8
- Don't allow swaps and withdrawals with more than 2 decimals #10
- Don't allow deposits with more than 2 decimals
## Bugs fixed
- Can't make withdrawals/swaps with decimals and less than 1 (w)BAN #1
- After a successful withdrawals the amount should be reset #2
- Small deposits of BAN don't work

# v0.4.2
## Improvements
- Decimal amounts in swaps and withdrawals
- Swap amounts reset after a swap
- Refresh balances button gone!
## Bugs fixed
- Scheduled jobs for missed BAN transactions from the WS API should work now
- Scheduled jobs for missed BAN transactions will fail in case there is a problem sending BAN back
- The backend should reconnect to the Banano WS API if there is a network failure/error
- Checks for amounts bigger than 0

# v0.4.1
## New Features
- withdrawal amount can be specified
## Improvements
- Swaps wBAN->BAN are not withdrawals anymore but increase in user deposits
- Notifications & dialogs for swaps
- Total supply is automatically updated when someone makes a swap
## Bugs fixed
- computation of hot/cold wallet splits

# v0.4.0
## New Features
- Pending withdrawals if hot wallet is running out of BAN
## Improvements
- Notifications
- Easy setup of BSC network

# v0.2.3
## Bugs fixed
- Critical bug allowing two different BSC users to claim the same BAN wallet
- Footer color on the setup process

# v0.2.2
## New Features
- BAN withdrawal
- New UI
## Improvements
- Notification display on successful transactions
- Responsive layout
- Dark mode enabled by default

# v0.2.1
## New Features
- Dark mode
## Improvements
- Notification on successful transactions
## Bugs fixed
- Title of the app in the browser window

# v0.2.0
## New Features
- Compatibility with MetaMask on Android
## Improvements
- setup process with responsive design
- Kalium links on mobiles for an easier way to make deposits
- changed color of the toolbar to the Banano green
