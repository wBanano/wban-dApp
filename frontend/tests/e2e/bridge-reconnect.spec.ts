

describe("Bridge Reconnect", () => {
	const browserSettings = {
		onBeforeLoad(win: any) {
			Object.defineProperty(win.navigator, 'language', { value: 'en-US' });
		},
	}

  afterEach(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
    cy.resetMetamaskAccount();
  });

	it("Should restore bridge setup", () => {
		cy.visit("/", browserSettings);

		cy.switchMetamaskAccount(1).should("be.true");

		cy.get("#connect").click();

		const onboard = cy.get('onboard-v2').shadow();
		onboard.findByText(/MetaMask/i).click();
		cy.acceptMetamaskAccess();

		cy.findByText(/I'm new to wBAN/i).should('be.visible');
		cy.findByText(/Ethereum/i).should('be.visible');

		const apiEndpoint = 'https://ethereum-api.banano.cc'
		const fakeBanAddy = 'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w';

		// fake relink request
		cy.intercept('GET', `${apiEndpoint}/relink`, {
			statusCode: 200,
			body: {
				banAddresses: [fakeBanAddy],
			},
		}).as('relink');
		// fake bridge setup done request
		cy.intercept('GET', `${apiEndpoint}/claim/**`, { statusCode: 200 }).as('checkBridgeSetup');

		// relink action
		cy.get('#relink').click();
		cy.confirmMetamaskSignatureRequest();
		cy.wait(['@relink', '@checkBridgeSetup']);

		// we should be on home page with wBAN statistics displayed
		cy.contains('wBAN Statistics');
  });

});
