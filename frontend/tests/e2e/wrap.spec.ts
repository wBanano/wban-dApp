const apiEndpoint = 'https://polygon-api.banano.cc'

describe('Wrap', () => {
	const banAddy = 'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w'

	afterEach(() => {
		cy.disconnectMetamaskWalletFromAllDapps()
		//cy.resetMetamaskAccount();
	})

	it('Should wrap', () => {
		cy.intercept('GET', `${apiEndpoint}/deposits/ban/${banAddy}`, {
			statusCode: 200,
			body: {
				balance: '777',
			},
		}).as('banDeposits')
		cy.intercept('GET', `${apiEndpoint}/gasless/settings`, {
			statusCode: 200,
			body: {
				enabled: true,
				banThreshold: '42',
				cryptoThreshold: '5',
				swapContract: '0x35FB7b4c899B8c86533fEd40aE906A51a9702Deb',
			},
		}).as('gaslessSettings')
		cy.intercept('POST', `${apiEndpoint}/swap`, { statusCode: 201 }).as('wrapRequest')

		cy.login(banAddy, 'polygon')
		cy.wait('@banDeposits')

		cy.contains('Balance: 777 BAN')

		const from = cy.get('div.token-chooser-card[data-cy="from"]')
		const to = cy.get('div.token-chooser-card[data-cy="to"]')
		const wrapButton = cy.get('button[data-cy="wrap-button"')

		// test error message when not having enough BAN deposited
		from.type('7777').contains('Not enough available')
		//wrapButton.should('be.disabled');

		// wrap 777 BAN
		from.clear().type('777')
		to.get('input[disabled="disabled"]').should('have.value', 777)
		wrapButton.click()

		// sign wrap request
		cy.confirmMetamaskSignatureRequest()
		cy.contains('Wrap of 777 BAN in progress')
		cy.wait('@wrapRequest')
	})
})
