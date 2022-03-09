<template>
	<div class="token-chooser-card bg-token-chooser">
		<q-item style="min-height: auto; padding-bottom: 0; font-size: 14px">
			<q-item-section top>
				<q-item-label>{{ label }}</q-item-label>
			</q-item-section>
			<q-item-section top class="col-9 text-right" v-if="value.token">
				<q-item-label>
					Balance: {{ balanceFormatted }} {{ value.token.symbol }}
					<span v-if="value.token.symbol === 'wBAN'">({{ balance | banPrice }})</span>
				</q-item-label>
			</q-item-section>
		</q-item>
		<div class="q-pa-md emphasis">
			<div class="row">
				<div class="col col-sm-4 col-xs-6">
					<token-chooser v-if="value.token" v-model="value.token" @token-changed="onTokenChanged($event)" />
				</div>
				<div class="col-input col col-sm-6 col-xs-12">
					<q-input
						ref="amount"
						class="token-amount"
						dense
						borderless
						hide-bottom-space
						no-error-icon
						v-model="value.amount"
						debounce="500"
						@input="emitUpdatedAmountEvent($event)"
						input-class="ellipsis"
						placeholder="0.0"
						:readonly="disable"
						:rules="validationRules"
					/>
				</div>
				<div v-if="!disable" class="col-sm-2 col-xs-6 text-right max">
					<q-btn v-if="value.token" @click="setToMax" flat dense text-color="primary" class="emphasis">Max</q-btn>
				</div>
			</div>
		</div>
		<!--
		<div class="add-token-to-metamask col-12 q-pa-md q-gutter-md align-right">
			<a @click="addTokenToMetaMask">
				Add {{ value.token.symbol }} to MetaMask
				<q-icon name="img:metamask.svg" size="24px" />
			</a>
		</div>
	-->
	</div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { BigNumber, ethers } from 'ethers'
import { bnToStringFilter, banPriceFilter } from '@/utils/filters'
import accounts from '@/store/modules/accounts'
import TokenChooser from '@/components/tokens/TokenChooser.vue'
import MetaMask from '@/utils/MetaMask'
import { TokenAmount } from '@/models/dex/TokenAmount'
import { Token } from '@/config/constants/dex'
import TokensUtil from '@/utils/TokensUtil'
import { sleep } from '@/utils/AsyncUtils'

const accountsStore = namespace('accounts')

@Component({
	components: {
		TokenChooser,
	},
	filters: {
		bnToStringFilter,
		banPriceFilter,
	},
})
export default class TokenInput extends Vue {
	@Prop({ type: String, required: true }) readonly label!: string
	@Prop({ type: Object, required: true }) value!: TokenAmount
	@Prop({ type: Boolean, required: false }) disable!: boolean
	balance = '0'
	balanceAmount: BigNumber = BigNumber.from(0)

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	@Ref('amount') readonly amountField!: any

	@accountsStore.State('activeAccount')
	user!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.JsonRpcProvider | null

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	updateBalanceLoop!: any

	get balanceFormatted(): string {
		if (this.value.token.symbol === 'wBAN') {
			return Number.parseFloat(this.balance).toFixed(3)
		} else {
			return Number.parseFloat(this.balance).toFixed(8)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get validationRules(): Array<any> {
		if (this.disable) {
			return []
		} else {
			return [
				(val: string) => val === '' || Number.parseFloat(val) > 0 || 'Amount should be more than zero',
				(val: string) => this.hasNotTooManyDecimals(val) || `No more than ${this.value.token.decimals} decimals`,
				(val: string) => this.isLowerThanMax(val) || `Not enough ${this.value.token.symbol}!`,
			]
		}
	}

	get error(): boolean | undefined {
		return this.amountField.hasError
	}

	get errorMessage(): string {
		return this.amountField.innerErrorMessage
	}

	async setToMax() {
		this.value.amount = this.balance
		this.emitUpdatedAmountEvent(this.value.amount)
	}

	hasNotTooManyDecimals(val: string): boolean {
		if (val === '') {
			return true
		}
		try {
			ethers.utils.parseUnits(this.value.amount, this.value.token.decimals)
			return true
		} catch (err) {
			return false
		}
	}

	isLowerThanMax(val: string): boolean {
		if (val === '') {
			return true
		} else {
			return ethers.utils
				.parseUnits(val, this.value.token.decimals)
				.lte(ethers.utils.parseUnits(this.balance, this.value.token.decimals))
		}
	}

	async addTokenToMetaMask() {
		if (this.value.token.symbol === 'wBAN') {
			accounts.addWBANTokenToMetaMask()
		} else {
			const { token } = this.value
			MetaMask.addTokenToWallet(token.address, token.symbol, token.decimals, token.logoURI)
		}
	}

	emitUpdatedAmountEvent(event: string) {
		this.$emit('update:amount', event)
	}

	public async validate(): Promise<boolean> {
		await sleep(500)
		return this.amountField.validate()
	}

	public resetValidation() {
		this.amountField.resetValidation()
	}

	async onTokenChanged(token: Token) {
		if (token === null) {
			console.warn('No token picked')
			return
		}
		this.$emit('token-changed', token)
		this.value.amount = ''
		Object.assign(this.value.token, token)
		this.loadBalance()
	}

	async loadBalance() {
		if (!this.provider) {
			console.error('Missing Web3 provider')
			return
		}
		// load balance if token chosen
		if (this.value.token && this.value.token.address !== '') {
			this.balanceAmount = await TokensUtil.getBalance(this.user, this.value.token, this.provider)
			if (this.balanceAmount.isZero()) {
				this.balance = '0'
			} else {
				this.balance = ethers.utils.formatUnits(this.balanceAmount, this.value.token.decimals)
			}
		}
	}

	async mounted() {
		this.updateBalanceLoop = setInterval(() => this.loadBalance(), 5_000)
		await sleep(1_000)
		this.loadBalance()
	}

	unmounted() {
		clearInterval(this.updateBalanceLoop)
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

.token-chooser-card
	padding-top: $space-base
	padding-bottom: $space-base
	border: 1px solid $secondary
	&:hover
		border: 1px solid $primary

.emphasis
	padding-top: 0.5 * $space-base !important
	padding-bottom: 0.5 * $space-base !important
	font-size: 18px

.col-input
	label
		padding-bottom: 0

.token-amount
	padding-bottom: 0px
	input
		font-size: 18px
		font-weight: bold
		text-align: right
		border-radius: 4px
		padding-left: 0.5 * $space-base
		padding-right: 0.5 * $space-base
		padding-bottom: 0
		padding-top: 0
		background-color: lighten($secondary, 8%)
	&.q-field--error input
		color: $negative
	.q-field__bottom
		display: none

.max button
	padding-bottom: 0 !important
	padding-top: 0 !important
	font-weight: normal
	.q-btn__wrapper
		padding-bottom: 0
		padding-top: 0
		font-size: 18px

.add-token-to-metamask
	padding-top: 0.5 * $space-base !important
	padding-bottom: 0.5 * $space-base !important

.q-card__section
	padding-top: 0
	padding-bottom: 6px

.align-right
	text-align: right

@media (max-width: $breakpoint-sm-min)
	.col-input
		order: 3

body.body--light .bg-token-chooser
	background-color: lighten($secondary, 75%) !important
body.body--dark .bg-token-chooser
	background-color: lighten($secondary, 10%) !important
body.body--dark .add-token-to-metamask a
	color: $primary
	cursor: pointer
	font-size: .8em
.q-field--disabled .q-field__control > div.q-field__append
	opacity: 1 !important
</style>
