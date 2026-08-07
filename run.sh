npx esbuild test.ts --bundle --platform=node --format=cjs --outfile=test .cjs --loader:.webp=file --loader:.svelte=file --loader:.proto=file --packages=external && node test.cjs
