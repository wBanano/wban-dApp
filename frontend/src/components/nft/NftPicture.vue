<template>
	<q-img
		v-if="uri !== null"
		:src="uri"
		:class="nftClass"
		fit="scaled-down"
		spinner-color="white"
		style="max-width: 300px; height: 300px;"
	/>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class NftPicture extends Vue {
	@Prop({ type: String, required: true }) uri!: string
	@Prop({ type: Boolean, default: false }) disabled!: boolean

	get nftClass() {
		if (this.disabled) {
			return 'nft-disabled'
		} else {
			return ''
		}
	}
}
</script>

<style lang="sass" scoped>
.nft-disabled
	opacity: 0.2
</style>
