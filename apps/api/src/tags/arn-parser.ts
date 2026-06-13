export type ParsedArn = {
  service: string;
  type: string | null;
  region: string | null;
  accountId: string | null;
  name: string | null;
};

export function parseArn(arn: string): ParsedArn {
  const parts = arn.split(':');
  const [, , service = '', region = '', accountId = '', ...resourceParts] = parts;
  const resource = resourceParts.join(':');
  const parsedResource = parseResource(resource);

  return {
    service,
    type: parsedResource.type,
    region: region || null,
    accountId: accountId || null,
    name: parsedResource.name,
  };
}

function parseResource(resource: string) {
  if (!resource) {
    return { type: null, name: null };
  }

  const slash = resource.indexOf('/');
  if (slash > 0) {
    return {
      type: resource.slice(0, slash),
      name: resource.slice(slash + 1) || null,
    };
  }

  const colon = resource.indexOf(':');
  if (colon > 0) {
    return {
      type: resource.slice(0, colon),
      name: resource.slice(colon + 1) || null,
    };
  }

  return { type: null, name: resource };
}
