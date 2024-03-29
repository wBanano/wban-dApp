<template>
	<span>
		<q-btn v-if="!isUserConnected" @click="connectWalletProvider" flat dense>{{ $t('connect') }}</q-btn>
		<q-select
			v-if="isUserConnected"
			borderless
			dense
			v-model="selectedBlockchain"
			:options="supportedBlockchains"
			option-label="chainName"
			emit-value
		>
			<template v-slot:prepend>
				<q-chip v-if="!isMainnet" square color="red" text-color="white" icon="warning" class="gt-xs">Testnet</q-chip>
				<q-icon :name="selectedBlockchainIcon">
					<q-tooltip>{{ activeAccount }}</q-tooltip>
				</q-icon>
			</template>
			<template v-slot:option="scope">
				<q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
					<q-item-section avatar>
						<q-icon :name="getBlockchainIcon(scope.opt.network)" />
					</q-item-section>
					<q-item-section>
						<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
						<q-item-label v-html="scope.opt.chainName" />
					</q-item-section>
				</q-item>
			</template>
		</q-select>
	</span>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Network, Networks } from '@/utils/Networks'
import accounts from '@/store/modules/accounts'

const accountsStore = namespace('accounts')

@Component
export default class BlockchainChooser extends Vue {
	@accountsStore.State('network')
	currentBlockchain!: Network

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@accountsStore.State('activeAccount')
	activeAccount!: string

	networks = new Networks()

	get isMainnet() {
		return this.networks
			.getMainnetSupportedNetworks()
			.find((network) => network.chainId === this.currentBlockchain.chainId)
	}

	get supportedBlockchains(): Network[] {
		return this.networks.getSupportedNetworks()
	}

	get selectedBlockchain(): Network {
		return this.currentBlockchain
	}

	set selectedBlockchain(network: Network) {
		accounts.switchBlockchain(network)
	}

	get selectedBlockchainIcon(): string {
		return this.getBlockchainIcon(this.currentBlockchain.network)
	}

	getBlockchainIcon(network: string): string {
		return `img:${network}-home-logo.svg`
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}
}
</script>

<style lang="sass" scoped></style>
