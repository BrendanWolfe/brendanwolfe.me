// @ts-check

/**
 * @param {string | undefined} raw
 */
export function toBoolean(raw) {
  if (!raw) {
    return undefined;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

/**
 * @param {string | undefined} siteUrlEnv
 */
export function getSiteUrl(siteUrlEnv) {
  return siteUrlEnv ?? 'https://brendanwolfe.me';
}

/**
 * @param {string} siteUrl
 */
export function getAllowedDomainsFromSiteUrl(siteUrl) {
  const parsedSiteUrl = new URL(siteUrl);
  const protocol = parsedSiteUrl.protocol.replace(':', '');
  const basePattern = {
    protocol,
    hostname: parsedSiteUrl.hostname,
    ...(parsedSiteUrl.port ? { port: parsedSiteUrl.port } : {})
  };

  const patterns = [basePattern];
  const hostname = parsedSiteUrl.hostname;
  const isLocalHost = hostname === 'localhost' || hostname.endsWith('.local');
  const hasSubdomain = hostname.split('.').length > 2;

  if (!isLocalHost) {
    if (hostname.startsWith('www.')) {
      patterns.push({
        ...basePattern,
        hostname: hostname.slice(4)
      });
    } else if (!hasSubdomain) {
      patterns.push({
        ...basePattern,
        hostname: `www.${hostname}`
      });
    }
  }

  return patterns;
}
