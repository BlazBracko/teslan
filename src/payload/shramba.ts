import { s3Storage } from "@payloadcms/storage-s3";
import type { Env } from "../env";

export type NastavitveR2 = {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

/**
 * Nastavitve Cloudflare R2, če so nastavljene vse S3 spremenljivke
 * (`src/env.ts` zahteva vse ali nič), sicer `undefined` (lokalni disk).
 */
export function nastavitveR2(env: Env): NastavitveR2 | undefined {
  const {
    S3_BUCKET,
    S3_ENDPOINT,
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_PUBLIC_URL,
  } = env;
  if (
    !S3_BUCKET ||
    !S3_ENDPOINT ||
    !S3_ACCESS_KEY_ID ||
    !S3_SECRET_ACCESS_KEY ||
    !S3_PUBLIC_URL
  ) {
    return undefined;
  }
  return {
    bucket: S3_BUCKET,
    endpoint: S3_ENDPOINT,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    publicUrl: S3_PUBLIC_URL.replace(/\/+$/, ""),
  };
}

/** Javni naslov datoteke v R2: `<S3_PUBLIC_URL>/<predpona>/<ime>`. */
export function javniUrlSlike(
  publicUrl: string,
  prefix: string | undefined,
  filename: string,
): string {
  return [publicUrl, prefix, encodeURIComponent(filename)]
    .filter(Boolean)
    .join("/");
}

/**
 * Shramba slik (Z83): R2 prek S3 API ali lokalni disk.
 *
 * Vtičnik je vedno vključen z `alwaysInsertFields`, da je shema baze enaka
 * z R2 ali brez njega; sicer bi se migracije razlikovale med okolji.
 */
export function shrambaSlik(env: Env) {
  const r2 = nastavitveR2(env);
  return s3Storage({
    enabled: r2 !== undefined,
    alwaysInsertFields: true,
    bucket: r2?.bucket ?? "",
    config: {
      endpoint: r2?.endpoint,
      // R2 ne pozna regij; SDK jo vseeno zahteva.
      region: "auto",
      forcePathStyle: true,
      credentials: r2
        ? { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey }
        : undefined,
    },
    collections: {
      media: {
        prefix: "media",
        // Slike se strežejo neposredno z javnega R2 naslova, ne prek strežnika.
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) =>
          javniUrlSlike(r2?.publicUrl ?? "", prefix, filename),
      },
    },
  });
}
