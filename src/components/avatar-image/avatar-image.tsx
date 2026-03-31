import { User } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { AvatarImageProps } from './avatar-image.types'

export function AvatarImage({
  avatar,
  size = 36,
  className,
}: AvatarImageProps) {
  const hasImage =
    avatar &&
    (avatar.startsWith('images/') ||
      avatar.startsWith('/images/') ||
      avatar.startsWith('http'))

  if (hasImage) {
    // Ensure local paths are absolute to avoid nested route resolution issues
    const src = avatar.startsWith('images/') ? `/${avatar}` : avatar
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
