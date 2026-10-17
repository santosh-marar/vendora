import { DiscountType, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export async function updateVariationPrices(
  tx: Prisma.TransactionClient,
  discountId: string
) {
  const discount = await tx.discount.findUnique({
    where: { id: discountId },
  });

  if (!discount) return;

  const variations = await tx.productVariationDiscount.findMany({
    where: { discountId },
    include: { variation: true },
  });

  for (const vd of variations) {
    const discountedPrice = calculateDiscountPrice(
      vd.variation.price,
      discount
    );
    await tx.productVariation.update({
      where: { id: vd.variationId },
      data: { discountPrice: discountedPrice },
    });
  }
}

export async function resetVariationPrices(
  tx: Prisma.TransactionClient,
  variationIds: string[]
) {
  // Get all active discounts for these variations
  const activeDiscounts = await tx.productVariationDiscount.findMany({
    where: {
      variationId: { in: variationIds },
      discount: {
        isActive: true,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    },
    select: { variationId: true },
  });

  // Find variations that don't have any active discounts
  const activeVariationIds = activeDiscounts.map((d) => d.variationId);
  const variationsToReset = variationIds.filter(
    (id) => !activeVariationIds.includes(id)
  );

  // Reset their prices
  if (variationsToReset.length > 0) {
    await tx.productVariation.updateMany({
      where: {
        id: { in: variationsToReset },
        discountPrice: { not: null },
      },
      data: { discountPrice: null },
    });
  }
}

export function calculateDiscountPrice(
  originalPrice: number,
  discount: {
    discountType: DiscountType;
    value: number;
    buyQuantity?: number | null;
    getQuantity?: number | null;
  }
): number {
  switch (discount.discountType) {
    case "PERCENTAGE":
      return Math.max(originalPrice * (1 - discount.value / 100), 0);
    case "FIXED_AMOUNT":
      return Math.max(originalPrice - discount.value, 0);
    case "BUY_X_GET_Y":
      // For BOGO, we'll handle the actual discount during cart calculation
      return originalPrice; // Display original price with BOGO badge
    default:
      return originalPrice;
  }
}


export async function validateDiscountApplication(
  discountId: string,
  variationId: string,
  userId: string,
  tx: Prisma.TransactionClient
) {
  // 1. Verify discount exists and is active
  const discount = await tx.discount.findUnique({
    where: { id: discountId },
  });

  if (!discount?.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Discount is not active",
    });
  }

  // 2. Check date validity
  const now = new Date();
  if (now < discount.startDate) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Discount has not started yet",
    });
  }

  if (discount.endDate && now > discount.endDate) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Discount has expired",
    });
  }

  // 3. Check usage limits
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Discount usage limit reached",
    });
  }

  // 4. Verify variation is eligible
  const isApplicable = await tx.productVariationDiscount.findFirst({
    where: {
      variationId,
      discountId,
    },
  });

  if (!isApplicable) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Discount not applicable to this product variation",
    });
  }

  return discount;
}