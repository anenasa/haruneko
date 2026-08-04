export async function resolve(specifier, context, nextResolve) {
    if (specifier.includes("?worker") || specifier.includes("?inline")) {
        return {
            url: "data:text/javascript,export default class BackgroundTimersWorker {}",
            shortCircuit: true
        };
    }

    if (/\.(webp|png|jpg|jpeg|gif|svg|proto)$/.test(specifier)) {
        return {
            url: "data:text/javascript,export default '';",
            shortCircuit: true
        };
    }

    return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
    if (url.startsWith("data:text/javascript")) {
        return {
            format: "module",
            source: decodeURIComponent(url.split(",")[1]),
            shortCircuit: true
        };
    }

    return nextLoad(url, context);
}