describe('Auto Reconnect Web3 Wallet', () => {
	const banAddy = 'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w'

	afterEach(() => {
		cy.disconnectMetamaskWalletFromAllDapps()
		//cy.resetMetamaskAccount();
	})

	it('Should automatically reconnect wallet when reloading main page', () => {
		cy.login(banAddy, 'ethereum')
		// we should be on home page with wBAN statistics displayed
		cy.contains('wBAN Statistics')

		// reload page
		cy.reload()

		// we should still be on the main page
		cy.contains('wBAN Statistics')
	})

	it('Should automatically reconnect wallet when reloading farms page', () => {
		cy.login(banAddy, 'ethereum')
		// we should be on home page with wBAN statistics displayed
		cy.contains('wBAN Statistics')

		// let's go to farms page
		cy.findByText(/Stake & farm/i).click()
		cy.contains('wBAN Earned')

		// reload page
		cy.reload()

		// we should still be on the main page
		cy.contains('wBAN Earned')
	})
})
