<template>
	<q-page>
		<div v-if="isUserConnected" class="q-pa-md row justify-center items-start q-gutter-md">
			<div class="col-2">
				<Statistics />
			</div>
			<div class="col-5">
				<ChainInfo />
			</div>
		</div>
		<div v-if="!isUserConnected">
			Make a great page explaining here what wBAN is all about and to invite user to click on the connect button :)
		</div>
	</q-page>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Statistics from '@/components/Statistics.vue'
import ChainInfo from '@/components/ChainInfo.vue'
import accounts from '@/store/modules/accounts'

@Component({
	components: {
		Statistics,
		ChainInfo
	}
})
export default class PageIndex extends Vue {
	get isUserConnected() {
		return accounts.isUserConnected
	}
}
</script>
