import { z } from "zod";
import { createTRPCRouter, sellerProcedure } from "../../trpc";
import {
  GenericAttributesSchema,
  HoodieAttributesSchema,
  JacketAttributesSchema,
  PantAttributesSchema,
  ShirtAttributesSchema,
  ShoeAttributesSchema,
  TShirtAttributesSchema,
  UndergarmentAttributesSchema,
} from "@/validation/product/attribute";

export const productAttributesRouter = createTRPCRouter({
  // T-Shirt attributes
  upsertTShirtAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: TShirtAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tShirtAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          ...input.attributes,
          productVariationId: input.productVariationId,
        },
        update: input.attributes,
      });
    }),

  // Pant attributes
  upsertPantAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: PantAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pantAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          ...input.attributes,
          productVariationId: input.productVariationId,
        },
        update: input.attributes,
      });
    }),

  // Shoe attributes
  upsertShoeAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: ShoeAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.shoeAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          ...input.attributes,
          productVariationId: input.productVariationId,
        },
        update: input.attributes,
      });
    }),

  // Shirt attributes
  upsertShirtAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: ShirtAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.shirtAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          ...input.attributes,
          productVariationId: input.productVariationId,
        },
        update: input.attributes,
      });
    }),

  // Jacket attributes
  upsertJacketAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: JacketAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.jacketAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          ...input.attributes,
          productVariationId: input.productVariationId,
        },
        update: input.attributes,
      });
    }),

  // // Hoodie attributes
  // upsertHoodieAttributes: sellerProcedure
  //   .input(
  //     z.object({
  //       productVariationId: z.string(),
  //       attributes: HoodieAttributesSchema,
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.db.hoodieAttributes.upsert({
  //       where: { productVariationId: input.productVariationId },
  //       create: {
  //         ...input.attributes,
  //         productVariationId: input.productVariationId,
  //       },
  //       update: input.attributes,
  //     });
  //   }),

  // Undergarment attributes
  upsertUndergarmentAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: UndergarmentAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.undergarmentAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          ...input.attributes,
          productVariationId: input.productVariationId,
        },
        update: input.attributes,
      });
    }),

  // Generic attributes
  upsertGenericAttributes: sellerProcedure
    .input(
      z.object({
        productVariationId: z.string(),
        attributes: GenericAttributesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.genericAttributes.upsert({
        where: { productVariationId: input.productVariationId },
        create: {
          attributes: input.attributes.attributes as any,
          productVariationId: input.productVariationId,
        },
        update: {
          attributes: input.attributes.attributes as any,
        },
      });
    }),

  // Delete attributes
  // deleteAttributes: sellerProcedure
  //   .input(
  //     z.object({
  //       productVariationId: z.string(),
  //       productType: z.enum([
  //         "t-shirt",
  //         "pant",
  //         "shoe",
  //         "shirt",
  //         "jacket",
  //         "hoodie",
  //         "undergarment",
  //         "generic",
  //       ]),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const attributeMap = {
  //       "t-shirt": ctx.db.tShirtAttributes,
  //       pant: ctx.db.pantAttributes,
  //       shoe: ctx.db.shoeAttributes,
  //       shirt: ctx.db.shirtAttributes,
  //       jacket: ctx.db.jacketAttributes,
  //       hoodie: ctx.db.hoodieAttributes,
  //       undergarment: ctx.db.undergarmentAttributes,
  //       generic: ctx.db.genericAttributes,
  //     };

  //     return attributeMap[input.productType].delete({
  //       where: { productVariationId: input.productVariationId },
  //     });
  //   }),
});
