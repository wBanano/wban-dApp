<template>
	<q-item @click="openTokenChooserDialog" clickable dense class="token-display">
		<q-avatar size="32px">
			<img :src="value.logoURI" />
		</q-avatar>
		<span class="symbol">{{ value.symbol }}</span>
		<q-icon name="arrow_drop_down" class="arrow-down" />
	</q-item>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Token } from '@/config/constants/dex'
import SwapDialogs from '@/utils/SwapDialogs'

@Component
export default class TokenChooser extends Vue {
	@Prop({ type: Object, required: true }) value!: Token

	async openTokenChooserDialog() {
		const token = await SwapDialogs.showTokenChooserDialog(this)
		this.$emit('token-changed', token)
	}
}
</script>

<style lang="sass" scoped>
.token-display
	font-size: 18px
	padding-left: 0
	height: 40px
	vertical-align: middle
.symbol
	padding-left: 6px
	margin-top: auto
	margin-bottom: auto
	height: 32px
.arrow-down
	font-size: 2rem
	margin-left: -6px
	margin-top: -2px
</style>
