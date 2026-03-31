import { User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { resolveAvatarSrc } from '@/lib/resolve-avatar-src'
import type { AvatarImageProps } from './avatar-image.types'

export function AvatarImage({
  avatar,
  size = 36,
  className,
}: AvatarImageProps) {
  const resolved = avatar ? resolveAvatarSrc(avatar) : ''

  // Determine if a resolvable image source exists
  const hasImage =
    resolved &&
    (resolved.startsWith('images/') ||
      resolved.startsWith('/images/') ||
      resolved.startsWith('http'))

  if (hasImage) {
    // Ensure local paths are absolute to avoid nested route resolution issues
    const src = resolved.startsWith('images/') ? `/${resolved}` : resolved
    return (
      <img
        src={src}
        alt="avatar"
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-muted text-muted-foreground',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.6} />
    </div>
  )
}
