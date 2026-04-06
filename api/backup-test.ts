import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Step 1: Import aws-sdk
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3')
    res.status(200).json({ step: 1, msg: 'import OK' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    res.status(500).json({ error: message, stack })
  }
}
