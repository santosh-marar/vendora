// server/api/routers/wishlist.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const wishlistRouter = createTRPCRouter({
  // Toggle item in wishlist (add/remove)
  toggleItem: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        variationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;

      const { productId, variationId } = input;

      // Check if item exists
      const existingItem = await ctx.db.wishlistItem.findFirst({
        where: {
          wishlist: { userId },
          productId,
          productVariationId: variationId || null,
        },
      });

      if (existingItem) {
        // Remove if exists
        await ctx.db.wishlistItem.delete({
          where: { id: existingItem.id },
        });
        return { action: "removed" };
      } else {
        // Ensure wishlist exists
        await ctx.db.wishlist.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });

        // Add new item
        await ctx.db.wishlistItem.create({
          data: {
            wishlist: { connect: { userId } },
            product: { connect: { id: productId } },
            ...(variationId && {
              productVariation: { connect: { id: variationId } },
            }),
          },
        });
        return { action: "added" };
      }
    }),

  // Get full wishlist with product details
  getWishlist: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.wishlist.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                productVariations: {
                  include: {
                    tShirtAttributes: true,
                    pantAttributes: true,
                    shirtAttributes: true,
                    jacketAttributes: true,
                    hoodieAttributes: true,
                    undergarmentAttributes: true,
                    shoeAttributes: true,
                    genericAttributes: true,
                  },
                },
              },
            },
            productVariation: {
              include: {
                tShirtAttributes: true,
                pantAttributes: true,
                shirtAttributes: true,
                jacketAttributes: true,
                hoodieAttributes: true,
                undergarmentAttributes: true,
                shoeAttributes: true,
                genericAttributes: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }),

  deleteWishlist: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id as string;

    await ctx.db.wishlist.delete({
      where: { userId },
    });

    return { success: true };
  }),

  moveToCart: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        variationId: z.string().optional(),
        quantity: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;

      // 1. Get product with price data
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
        include: {
          productVariations: {
            where: input.variationId ? { id: input.variationId } : undefined,
            take: 1,
          },
        },
      });

      if (!product) throw new Error("Product not found");

      // 2. Determine price (variation or base price)
      const basePrice = product.productVariations[0]?.price ;
      const variationPrice = input.variationId
        ? product.productVariations[0]?.price
        : undefined;
      const price = variationPrice ?? basePrice;
      if (price === undefined) throw new Error("Could not determine price");

      // 3. Ensure cart exists
      const cart = await ctx.db.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      // 4. Add to cart (with empty string fallback for variationId)
      await ctx.db.cartItem.upsert({
        where: {
          cartId_productVariationId: {
            cartId: cart.id,
            productVariationId: input.variationId || "",
          },
        },
        create: {
          cartId: cart.id,
          productId: input.productId,
          productVariationId: input.variationId || "",
          quantity: input.quantity,
          totalPrice: price * input.quantity,
        },
        update: {
          quantity: { increment: input.quantity },
          totalPrice: { increment: price * input.quantity },
        },
      });

      // 5. Remove from wishlist
      await ctx.db.wishlistItem.deleteMany({
        where: {
          wishlist: { userId },
          productId: input.productId,
          productVariationId: input.variationId || null,
        },
      });

      return { success: true };
    }),
});
