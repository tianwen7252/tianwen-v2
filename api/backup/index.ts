/**
 * GET /api/backup — List all backup files from R2.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getR2Client,
  getBucketName,
  getKeyPrefix,
  getS3Commands,
  errorResponse,
  jsonResponse,
} from './_lib/r2-client'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed', 405)
    return
  }

  try {
    const prefix = getKeyPrefix()
    const client = await getR2Client()
    const { ListObjectsV2Command } = await getS3Commands()

    const objects: Array<{
      filename: string
      size: number
      createdAt: string
    }> = []

    let continuationToken: string | undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })

      const result = await client.send(command)

      for (const obj of result.Contents ?? []) {
        const key = obj.Key ?? ''
        if (!key.endsWith('.sqlite.gz')) continue

        objects.push({
          filename: key.replace(prefix, ''),
          size: obj.Size ?? 0,
          createdAt: obj.LastModified?.toISOString() ?? new Date().toISOString(),
        })
      }

      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined
    } while (continuationToken)

    // Sort by createdAt descending
    objects.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    jsonResponse(res, { success: true, data: objects })
  } catch (err: unknown) {
    console.error('[api/backup] List error:', err)
    errorResponse(res, 'Internal server error', 500)
  }
}
