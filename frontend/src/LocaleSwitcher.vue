<template>
	<div class="locale-switcher">
		<q-select
			v-model="$i18n.locale"
			:options="langOptions"
			:label="$t('components.settings.language')"
			dense
			borderless
			emit-value
			map-options
			options-dense
			style="min-width: 150px"
		/>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component
export default class LocaleSwitcher extends Vue {
	get langOptions() {
		return [
			{ value: 'en', label: 'English' },
			{ value: 'pt-BR', label: 'Português - BR' },
			{ value: 'es', label: 'Español' },
			{ value: 'ru', label: 'Русский' },
			{ value: 'fr', label: 'Français' },
			{ value: 'it', label: 'Italiano' },
			{ value: 'de', label: 'Deutsch' },
			{ value: 'nl', label: 'Nederlands' },
			{ value: 'tr', label: 'Türkçe' },
			{ value: 'uk', label: 'Українська' },
			// { value: 'hi', label: 'हिन्दी' },
			{ value: 'id', label: 'Bahasa Indonesia' },
			{ value: 'vi', label: 'Tiếng Việt' },
		]
	}

	@Watch('$i18n.locale')
	chooseLanguage() {
		localStorage.locale = this.$i18n.locale
	}
}
</script>
