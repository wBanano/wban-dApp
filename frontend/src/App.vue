<template>
	<div id="q-app">
		<keep-alive>
			<router-view />
		</keep-alive>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
</script>
