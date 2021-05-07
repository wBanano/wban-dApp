import { RouteConfig } from 'vue-router'

const routes: RouteConfig[] = [
	{
		path: '/',
		component: () => import('@/layouts/MainLayout.vue'),
		children: [{ path: '', component: () => import('@/pages/Index.vue') }]
	},

	{
		path: '/history',
		component: () => import('@/layouts/MainLayout.vue'),
		children: [{ path: '', component: () => import('@/pages/History.vue') }]
	},

	{
		path: '/farms',
		component: () => import('@/layouts/MainLayout.vue'),
		children: [{ path: '', component: () => import('@/pages/Farms.vue') }]
	},

	{
		path: '/setup',
		component: () => import('@/layouts/MainLayout.vue'),
		children: [{ path: '', component: () => import('@/pages/Setup.vue') }]
	},

	{
		path: '/about',
		component: () => import('@/layouts/MainLayout.vue'),
		children: [{ path: '', component: () => import('@/pages/About.vue') }]
	},

	// Always leave this as last one,
	// but you can also remove it
	{
		path: '*',
		component: () => import('@/pages/Error404.vue')
	}
]

export default routes
