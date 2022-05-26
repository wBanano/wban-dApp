<template>
	<q-menu id="settings">
		<div class="row no-wrap q-pa-md">
			<div class="column">
				<div class="text-h6 q-mb-md">{{ $t('components.settings.title') }}</div>
				<q-toggle @input="changeDarkMode" v-model="darkMode" :label="$t('components.settings.dark-mode')" />
			</div>
			<!--
			<q-separator vertical inset class="q-mx-lg" />
			<div class="column items-center">
				<q-avatar size="72px">
					<img src="https://cdn.quasar.dev/img/avatar4.jpg" />
				</q-avatar>
				<div class="text-subtitle1 q-mt-md q-mb-xs">John Doe</div>
				<q-btn color="primary" label="Logout" push size="sm" v-close-popup />
			</div>
			-->
		</div>
		<q-list style="min-width: 200px">
			<q-item>
				<locale-switcher />
			</q-item>
			<q-item @click="disconnect" clickable v-close-popup>
				<q-item-section>{{ $t('components.settings.disconnect') }}</q-item-section>
			</q-item>
			<!--
			<q-item @click="about" clickable v-close-popup>
				<q-item-section>{{ $t('components.settings.about') }}</q-item-section>
			</q-item>
			-->
		</q-list>
	</q-menu>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import settings from '@/store/modules/settings'
import LocaleSwitcher from '@/LocaleSwitcher.vue'
import router from '@/router'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'

@Component({
	components: {
		LocaleSwitcher,
	},
})
export default class SettingsMenu extends Vue {
	darkMode = false

	changeDarkMode() {
		console.debug('in darkMode')
		settings.enableDarkMode(this.darkMode)
	}

	mounted() {
		this.darkMode = settings.isDarkModeEnabled
	}

	about() {
		router.push('/about')
	}

	async disconnect() {
		await accounts.disconnectWalletProvider()
		await ban.setBanAccount('')
		router.push('/')
	}
}
</script>
