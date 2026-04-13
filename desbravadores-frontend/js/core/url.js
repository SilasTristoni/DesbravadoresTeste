function normalizePath(path) {
    if (!path) {
        return "/";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalized = path.replace("/uploads/", "/file/");
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function getAppOrigin() {
    return window.location.origin;
}

export function buildApiUrl(path) {
    const normalizedPath = normalizePath(path);
    return /^https?:\/\//i.test(normalizedPath)
        ? normalizedPath
        : `${getAppOrigin()}${normalizedPath}`;
}

export function resolveAssetUrl(path) {
    return buildApiUrl(path);
}
