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
