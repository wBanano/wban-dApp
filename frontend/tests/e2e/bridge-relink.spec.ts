describe("Bridge Relink", () => {
  afterEach(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
    //cy.resetMetamaskAccount();
  });

	it("Should restore bridge setup", () => {
		cy.loginByBridgeRelink('ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w');

		// we should be on home page with wBAN statistics displayed
		cy.contains('wBAN Statistics');
  });

	// TODO
	/*
	it.skip('Should restore bridge setup when more than 1 Banano address if found', () => {
	});
	*/

	// TODO
	/*
	it.skip('Should notify user when trying to restore bridge setup that was never done', () => {
	});
	*/

});
