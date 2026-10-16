// Browser-safe counterpart of the upstream option builder. No process.env, proxies, or private desktop headers.
export default function createOption(query: Record<string, any>, crypto = '', checkToken: string | boolean = false) {
    return { crypto: query.crypto || crypto || '', cookie: query.cookie || '', checkToken: query.checkToken || checkToken };
}
