import { cn } from '@/lib/cn'
import type { Commodity } from '@/lib/schemas'
import { RippleButton } from '@/components/ui/ripple-button'
import { resolveProductImage } from '@/lib/resolve-product-image'

interface ProductCardProps {
  readonly commodity: Commodity
  readonly onAdd: (commodity: {
    id: string
    name: string
    price: number
    typeId: string
    includesSoup: boolean
  }) => void
}

/**
 * Product card displaying image, name, and price.
 * The entire card is clickable to add the item to the cart.
 */
export function ProductCard({ commodity, onAdd }: ProductCardProps) {
  const imageSrc = resolveProductImage(commodity.image)

  const handleClick = () => {
    onAdd({
      id: commodity.id,
      name: commodity.name,
      price: commodity.price,
      typeId: commodity.typeId,
      includesSoup: commodity.includesSoup ?? false,
    })
  }

  return (
    <RippleButton
      onClick={handleClick}
      rippleColor="rgba(127, 149, 106, 0.25)"
      className={cn(
        'flex w-full cursor-pointer flex-col items-center justify-center gap-1 border border-[#efefef] rounded-xl bg-card p-3 shadow-sm',
        'transition-all ease-in-out duration-200 hover:shadow-md active:scale-[0.9]',
      )}
    >
      {imageSrc != null && (
        <img
          src={imageSrc}
          alt={commodity.name}
          className="mb-1 size-15 rounded-full object-cover"
        />
      )}
      <span className="text-base text-card-foreground">{commodity.name}</span>
      <span className="text-base text-muted-foreground">
        ${commodity.price}
      </span>
    </RippleButton>
  )
}
