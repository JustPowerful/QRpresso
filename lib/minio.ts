import "server-only";

import { createHash, createHmac } from "node:crypto";

const region = "us-east-1";
const bucket = process.env.MINIO_BUCKET ?? "ai-hub-media";

function config() {
  const endpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
  const accessKey = process.env.MINIO_ROOT_USER;
  const secretKey = process.env.MINIO_ROOT_PASSWORD;
  if (!accessKey || !secretKey) {
    throw new Error("MinIO credentials are not configured.");
  }
  return { endpoint: new URL(endpoint), accessKey, secretKey };
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function objectPath(key: string) {
  return `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function signedRequest(
  method: string,
  key: string,
  body?: Buffer,
  contentType?: string,
  resourcePath = objectPath(key),
) {
  const { endpoint, accessKey, secretKey } = config();
  const url = new URL(resourcePath, endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? Buffer.alloc(0));
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${headers[name].trim()}\n`)
    .join("");
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { url, headers };
}

async function ensureBucket() {
  const { endpoint } = config();
  const bucketPath = `/${bucket}`;
  const signed = signedRequest("PUT", "", undefined, undefined, bucketPath);
  const bucketUrl = new URL(bucketPath, endpoint);
  const response = await fetch(bucketUrl, { method: "PUT", headers: signed.headers });
  if (response.ok || response.status === 409) return;
  throw new Error(`MinIO bucket setup failed (${response.status}).`);
}

export async function putMinioObject(key: string, body: Buffer, contentType: string) {
  await ensureBucket();
  const { url, headers } = signedRequest("PUT", key, body, contentType);
  const response = await fetch(url, { method: "PUT", headers, body: new Uint8Array(body) });
  if (!response.ok) throw new Error(`MinIO upload failed (${response.status}).`);
}

export async function getMinioObject(key: string) {
  const { url, headers } = signedRequest("GET", key);
  return fetch(url, { method: "GET", headers, cache: "no-store" });
}

export async function deleteMinioObject(key: string) {
  const { url, headers } = signedRequest("DELETE", key);
  const response = await fetch(url, { method: "DELETE", headers });
  if (!response.ok && response.status !== 404) {
    throw new Error(`MinIO delete failed (${response.status}).`);
  }
}
