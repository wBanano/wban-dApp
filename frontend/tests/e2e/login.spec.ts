describe("Login Account", () => {
	const browserSettings = {
		onBeforeLoad(win: any) {
			Object.defineProperty(win.navigator, 'language', { value: 'en-US' });
		},
	}

  afterEach(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
    cy.resetMetamaskAccount();
  });

	it("Should connect", () => {
    cy.visit("/", browserSettings);

		cy.switchMetamaskAccount(1).should("be.true");

		cy.get("#connect").click();

		const onboard = cy.get('onboard-v2').shadow();
		onboard.findByText(/MetaMask/i).click();
		cy.acceptMetamaskAccess();

		cy.findByText(/I'm new to wBAN/i).should('be.visible');
		cy.findByText(/Ethereum/i).should('be.visible');
  });

  it("Should connect to Arbitrum network", () => {
    cy.visit("/", browserSettings);

		cy.switchMetamaskAccount(1).should("be.true");

		cy.get('#connectToArbitrum').click();

		const onboard = cy.get('onboard-v2').shadow();
		onboard.findByText(/MetaMask/i).click();
		cy.acceptMetamaskAccess();
		cy.allowMetamaskToAddNetwork();
		cy.allowMetamaskToSwitchNetwork();

		cy.findByText(/I'm new to wBAN/i).should('be.visible');
		cy.findByText(/Arbitrum/i).should('be.visible');
  });
});
