/**
 * GET  /api/device — Read devices.json from R2.
 * PUT  /api/device — Upsert a device entry with name uniqueness check.
 *
 * IMPORTANT: @aws-sdk/client-s3 MUST be imported via dynamic import().
 * Static imports cause Vercel's Function bundler to crash with
 * FUNCTION_INVOCATION_FAILED due to ESM resolution issues in aws-sdk v3.
 * See: https://github.com/aws/aws-sdk-js-v3/issues/6614
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEVICES_KEY = 'devices.json'

interface DeviceEntry {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly mode: string
  readonly updatedAt: string
}

interface DevicesFile {
  readonly devices: DeviceEntry[]
}

async function readDevicesFile(
  client: import('@aws-sdk/client-s3').S3Client,
  bucket: string,
): Promise<DevicesFile> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: DEVICES_KEY }),
    )
    const body = result.Body
    if (!body) return { devices: [] }

    // Body is a readable stream — collect it
    const chunks: Uint8Array[] = []
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const text = Buffer.concat(chunks).toString('utf-8')
    return JSON.parse(text) as DevicesFile
  } catch (err: unknown) {
    // File not found — return empty device list
    const { S3ServiceException } = await import('@aws-sdk/client-s3')
    if (
      err instanceof S3ServiceException &&
      err.$metadata.httpStatusCode === 404
    ) {
      return { devices: [] }
    }
    // Also handle NoSuchKey by name
    if (err instanceof Error && err.name === 'NoSuchKey') {
      return { devices: [] }
    }
    throw err
  }
}

async function writeDevicesFile(
  client: import('@aws-sdk/client-s3').S3Client,
  bucket: string,
  data: DevicesFile,
): Promise<void> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: DEVICES_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }),
  )
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const { S3Client } = await import('@aws-sdk/client-s3')

  const accountId = process.env.R2_ACCOUNT_ID ?? ''
  const bucket = process.env.R2_BUCKET_NAME ?? ''

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })

  // ── GET /api/device ──────────────────────────────────────────────────────

  if (req.method === 'GET') {
    try {
      const data = await readDevicesFile(client, bucket)
      res.status(200).json({ success: true, data })
    } catch (err: unknown) {
      console.error('[api/device] GET error:', err)
      const message =
        err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ success: false, error: message })
    }
    return
  }

  // ── PUT /api/device ──────────────────────────────────────────────────────

  if (req.method === 'PUT') {
    try {
      const { id, name, type, mode } = req.body as {
        id?: string
        name?: string
        type?: string
        mode?: string
      }

      if (!id || !name || !type || !mode) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: id, name, type, mode',
        })
        return
      }

      const data = await readDevicesFile(client, bucket)

      // Check name uniqueness — allow the same device to keep its own name
      const isDuplicate = data.devices.some(
        device => device.name === name && device.id !== id,
      )
      if (isDuplicate) {
        res
          .status(409)
          .json({ success: false, error: 'Device name already in use' })
        return
      }

      const updatedAt = new Date().toISOString()
      const updatedEntry: DeviceEntry = { id, name, type, mode, updatedAt }

      const existingIndex = data.devices.findIndex(device => device.id === id)
      const updatedDevices =
        existingIndex >= 0
          ? data.devices.map((device, i) =>
              i === existingIndex ? updatedEntry : device,
            )
          : [...data.devices, updatedEntry]

      const updatedData: DevicesFile = { devices: updatedDevices }
      await writeDevicesFile(client, bucket, updatedData)

      res.status(200).json({ success: true, data: updatedEntry })
    } catch (err: unknown) {
      console.error('[api/device] PUT error:', err)
      const message =
        err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ success: false, error: message })
    }
    return
  }

  res.status(405).json({ success: false, error: 'Method not allowed' })
}
