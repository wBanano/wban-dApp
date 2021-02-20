<template>
	<q-menu id="settings">
		<div class="row no-wrap q-pa-md">
			<div class="column">
				<div class="text-h6 q-mb-md">Settings</div>
				<q-toggle @input="changeDarkMode" v-model="darkMode" label="Dark Mode" />
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
	</q-menu>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import settings from '@/store/modules/settings'

@Component
export default class SettingsMenu extends Vue {
	darkMode = false

	changeDarkMode() {
		console.debug('in darkMode')
		settings.enableDarkMode(this.darkMode)
	}

	mounted() {
		this.darkMode = settings.isDarkModeEnabled
	}
}
</script>
