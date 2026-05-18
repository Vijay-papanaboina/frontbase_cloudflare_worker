export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Extract subdomain like "Vijay-papanaboina-testing"
		const subdomain = url.hostname.split('.')[0];

		// Look up the R2 path prefix from KV
		const folderPrefix = await env.Frontbase_KV_Binding.get(subdomain);
		if (!folderPrefix) {
			return new Response('Subdomain not mapped', { status: 404 });
		}

		// Determine the path
		let pathname = url.pathname;
		if (pathname === '/' || pathname === '') {
			pathname = '/index.html'; // Default entry file
		}

		const key = `${folderPrefix}${pathname}`;
		console.log('Fetching R2 key:', key);

		function isAsset(path) {
			return /\.(js|css|png|jpg|jpeg|svg|ico|json|wasm|txt|woff2?|ttf|eot|gif|bmp|webp)$/i.test(path);
		}

		try {
			const object = await env.R2Binding.get(key);
			if (object) {
				// Serve the found file
				const ext = pathname.split('.').pop();
				const headers = new Headers();
				const contentType = getMimeType(ext);
				if (contentType) headers.set('Content-Type', contentType);

				// Add cache headers based on file type
				const cacheControl = getCacheControl(ext, pathname);
				headers.set('Cache-Control', cacheControl);

				// Add ETag for efficient caching
				if (object.etag) {
					headers.set('ETag', object.etag);
				}

				return new Response(object.body, { headers });
			}

			// If not found and not an asset, try to serve index.html for SPA routes
			if (!isAsset(pathname)) {
				const indexKey = `${folderPrefix}/index.html`.replace(/\/{2,}/g, '/');
				const indexObject = await env.R2Binding.get(indexKey);
				if (indexObject) {
					const headers = new Headers();
					headers.set('Content-Type', 'text/html');
					headers.set('Cache-Control', 'public, max-age=3600, must-revalidate'); // 1 hour for HTML

					if (indexObject.etag) {
						headers.set('ETag', indexObject.etag);
					}

					return new Response(indexObject.body, { headers });
				}
			}

			return new Response('404 Not Found', { status: 404 });
		} catch (err) {
			return new Response('Server Error', { status: 500 });
		}
	},
};

function getMimeType(ext) {
	return {
		html: 'text/html',
		js: 'application/javascript',
		css: 'text/css',
		json: 'application/json',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		svg: 'image/svg+xml',
		ico: 'image/x-icon',
		txt: 'text/plain',
		wasm: 'application/wasm',
	}[ext];
}

function getCacheControl(ext, pathname) {
	// HTML files: short cache for quick updates (1 hour)
	if (ext === 'html') {
		return 'public, max-age=3600, must-revalidate';
	}

	// Immutable assets (with hashes in filename): 1 year
	// Vite/Webpack typically generate files like: app.a1b2c3d4.js
	if (/\.[a-f0-9]{8,}\.(js|css)$/i.test(pathname)) {
		return 'public, max-age=31536000, immutable';
	}

	// JS and CSS without hashes: 1 hour (may update)
	if (ext === 'js' || ext === 'css') {
		return 'public, max-age=3600, must-revalidate';
	}

	// Images and fonts: 1 month
	if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'woff', 'woff2', 'ttf', 'eot'].includes(ext)) {
		return 'public, max-age=2592000, immutable';
	}

	// Other static assets: 1 day
	return 'public, max-age=86400';
}
