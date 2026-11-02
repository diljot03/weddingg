'use client';

/**
 * Face matching runs entirely on the guest's phone with @vladmandic/face-api.
 * A selfie gives each guest a 128-number face "fingerprint"; every uploaded
 * photo stores the fingerprints of the faces in it. "My photos" then shows
 * pictures whose faces are close enough to the guest's own. No images are sent
 * to any third-party service; only these numbers are saved in the database.
 */

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
export const MATCH_THRESHOLD = 0.5;

let loader: Promise<any> | null = null;

function loadFaceApi() {
  if (!loader) {
    loader = (async () => {
      // @ts-ignore: the browser bundle ships without a matching .d.ts path
      const faceapi = await import('@vladmandic/face-api/dist/face-api.esm.js');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi;
    })().catch((e) => {
      loader = null;
      throw e;
    });
  }
  return loader;
}

/** Returns one descriptor per face found (rounded to keep rows small). */
export async function describeFaces(source: HTMLCanvasElement | HTMLImageElement | Blob): Promise<number[][]> {
  const faceapi = await loadFaceApi();
  let input: HTMLCanvasElement | HTMLImageElement;
  if (source instanceof Blob) {
    input = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(source);
    });
  } else {
    input = source;
  }
  const results = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45, maxResults: 30 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  return results.map((r: any) => Array.from(r.descriptor as Float32Array).map((v) => Math.round(v * 10000) / 10000));
}

export function faceDistance(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export function photoMatches(faces: number[][] | null | undefined, me: number[] | null | undefined) {
  if (!faces?.length || !me?.length) return false;
  return faces.some((f) => faceDistance(f, me) < MATCH_THRESHOLD);
}
