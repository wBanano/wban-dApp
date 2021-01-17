<template>
	<div class="home">
		<ChainInfo />
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ChainInfo from '@/components/ChainInfo.vue'

@Component({
	components: {
		ChainInfo
	}
})
export default class Home extends Vue {}
</script>
