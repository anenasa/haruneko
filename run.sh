npx esbuild test.ts --bundle --platform=node --format=cjs --outfile=test.cjs --loader:.webp=dataurl --loader:.svelte=text --loader:.proto=text --packages=external && node test.cjs
