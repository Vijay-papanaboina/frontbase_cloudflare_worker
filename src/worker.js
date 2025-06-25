export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Extract subdomain like "Vijay-papanaboina-testing"
		const subdomain = url.hostname.split('.')[0];

		// Look up the R2 path prefix from KV
		const folderPrefix = await env.SUBDOMAIN_MAP.get(subdomain);
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

		try {
			const object = await env.R2Binding.get(key);
			if (!object) {
				return new Response('404 Not Found', { status: 404 });
			}

			// Determine content type
			const ext = pathname.split('.').pop();
			const headers = new Headers();
			const contentType = getMimeType(ext);
			if (contentType) headers.set('Content-Type', contentType);

			return new Response(await object.body, { headers });
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
