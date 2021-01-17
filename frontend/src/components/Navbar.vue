<template>
	<nav id="nav">
		<router-link to="/">Home</router-link> |
		<router-link to="/about">About</router-link>

		<div v-if="isUserConnected">
			<p><strong>Your current chain:</strong> {{ chainName }}</p>
			<p><strong>Your BNB balance:</strong> {{ activeBalanceBnb }}</p>
		</div>
		<a class="nav-link" href="#" v-if="!isUserConnected" @click="connectWalletProvider">
			Connect your wallet
		</a>
		<a class="nav-link" href="#" v-if="isUserConnected" @click="disconnectWalletProvider">
			Disconnect {{ activeAccount.substring(0, 7) }}...
		</a>
	</nav>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import accounts from '@/store/modules/accounts'

@Component
export default class HelloWorld extends Vue {
	get chainName() {
		return accounts.chainName
	}

	get isUserConnected() {
		return accounts.isUserConnected
	}

	get activeAccount() {
		return accounts.activeAccount
	}

	get activeBalanceBnb() {
		return accounts.activeBalanceBnb
	}

	async created() {
		await accounts.initWalletProvider()
		await accounts.ethereumListener()
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}

	async disconnectWalletProvider() {
		await accounts.disconnectWalletProvider()
	}
}
</script>
