// ***********************************************
// For comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import "@testing-library/cypress/add-commands";

declare global {
  namespace Cypress {
    interface Chainable {
			login(banAddy: string): void;
      loginByBridgeRelink(banAddy: string): void;
    }
  }
}

Cypress.Commands.add('login', (banAddy: string) => {
	Cypress.log({
		name: 'login',
		message: 'should login'
	});

	localStorage.setItem('locale', 'en');
	localStorage.setItem('banAddress', banAddy);
	localStorage.setItem('onboard.js:agreement', '{"version":"","terms":false,"privacy":false}');
	localStorage.setItem('onboard.js:last_connected_wallet', '["MetaMask"]');

	// fake bridge setup done request
	const apiEndpoint = 'https://ethereum-api.banano.cc';
	cy.intercept('GET', `${apiEndpoint}/claim/**`, { statusCode: 200 }).as('checkBridgeSetup');

	cy.visit("/");
	cy.get('#connectToEthereum').click();
	cy.acceptMetamaskAccess();

	cy.wait(['@checkBridgeSetup']);
});

Cypress.Commands.add('loginByBridgeRelink', (banAddy: string) => {
	Cypress.log({
		name: 'loginByBridgeRelink',
		message: 'should login via bridge relink'
	});

	localStorage.setItem('locale', 'en');

	cy.visit("/");

	cy.switchMetamaskAccount(1).should("be.true");

	cy.get('#connectToEthereum').click();

	const onboard = cy.get('onboard-v2').shadow();
	onboard.findByText(/MetaMask/i).click();
	cy.acceptMetamaskAccess();

	cy.findByText(/I'm new to wBAN/i).should('be.visible');
	cy.findByText(/Ethereum/i).should('be.visible');

	const apiEndpoint = 'https://ethereum-api.banano.cc';

	// fake relink request
	cy.intercept('GET', `${apiEndpoint}/relink`, {
		statusCode: 200,
		body: {
			banAddresses: [banAddy],
		},
	}).as('relink');
	// fake bridge setup done request
	cy.intercept('GET', `${apiEndpoint}/claim/**`, { statusCode: 200 }).as('checkBridgeSetup');

	// relink action
	cy.get('#relink').click();
	cy.confirmMetamaskSignatureRequest();

	cy.wait(['@relink', '@checkBridgeSetup']);
});
