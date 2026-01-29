"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TShirtAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/t-shirt";
import { PantAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/pant";
import { useEffect, useRef, useState } from "react";
import { ImageUploaderRef } from "@/@types/image";
import { api } from "@/trpc/react";
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
import { ImageUploader } from "@/components/custom/image-uploader";
import { handleError } from "@/lib/zod-error";
import { toast } from "sonner";
import { JacketAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/jacket";
import { ShirtAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/shirt";
import { UndergarmentAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/under-garment";
import { ShoeAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/shoe";
import { GenericAttributesFields } from "@/app/seller/_components/custom/product/form/attribute/generic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Constants and Types
 const categoryNames = [
  "t-shirt",
  "pant",
  "shoe",
  "shirt",
  "jacket",
  "hoodie",
  "undergarment",
  "generic",
] as const;

export type CategoryName = (typeof categoryNames)[number];

// Schema Mappings
const attributeSchemaMap = {
  "t-shirt": TShirtAttributesSchema,
  pant: PantAttributesSchema,
  shoe: ShoeAttributesSchema,
  shirt: ShirtAttributesSchema,
  jacket: JacketAttributesSchema,
  hoodie: HoodieAttributesSchema,
  undergarment: UndergarmentAttributesSchema,
  generic: GenericAttributesSchema,
} as const;

// Form schema
const formSchema = z.object({
  variations: z.array(
    z.object({
      price: z.number().positive("Price must be greater than 0"),
      stock: z.number().int().nonnegative("Stock cannot be negative"),
      size: z.string(),
      color: z.string(),
      gender: z.string().optional(),
      ageRange: z.string().optional(),
      modelNumber: z.string().optional(),
      warranty: z.string().optional(),
      attributes: z.record(z.string(), z.any()),
    })
  ),
  categoryName: z.enum(categoryNames),
});

type FormSchema = z.infer<typeof formSchema>;

// Setup mutations
const setupMutations = () => ({
  tShirtMutation: api.productAttribute.upsertTShirtAttributes.useMutation(),
  pantMutation: api.productAttribute.upsertPantAttributes.useMutation(),
  shoeMutation: api.productAttribute.upsertShoeAttributes.useMutation(),
  shirtMutation: api.productAttribute.upsertShirtAttributes.useMutation(),
  jacketMutation: api.productAttribute.upsertJacketAttributes.useMutation(),
  undergarmentMutation:
    api.productAttribute.upsertUndergarmentAttributes.useMutation(),
  genericMutation: api.productAttribute.upsertGenericAttributes.useMutation(),
});

// Component for rendering attribute fields based on category
const AttributeFields = ({
  category,
  index,
  control,
}: {
  category: CategoryName;
  index: number;
  control: any;
}) => {
  switch (category) {
    case "t-shirt":
      return <TShirtAttributesFields index={index} control={control} />;
    case "pant":
      return <PantAttributesFields index={index} control={control} />;
    case "jacket":
      return <JacketAttributesFields index={index} control={control} />;
    case "shirt":
      return <ShirtAttributesFields index={index} control={control} />;
    case "shoe":
      return <ShoeAttributesFields index={index} control={control} />;
    case "undergarment":
      return <UndergarmentAttributesFields index={index} control={control} />;
    case "generic":
      return <GenericAttributesFields index={index} control={control} />;
      break;
    default:
      return null;
  }
};

export default function AddVariationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const urlCategory = searchParams.get("category") as CategoryName | null;
  const [productImage, setProductImage] = useState("");
  const variationImageRefs = useRef<ImageUploaderRef>(null);

  const createProductVariation = api.productVariation.create.useMutation();
  const mutations = setupMutations();
  const deleteProductVariation = api.productVariation.delete.useMutation();

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variations: [
        {
          price: 1,
          stock: 0,
          attributes: {},
        },
      ],
      categoryName: urlCategory ?? "generic",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variations",
  });

  // Update category when URL changes
  useEffect(() => {
    if (urlCategory && categoryNames.includes(urlCategory)) {
      form.setValue("categoryName", urlCategory);
    }
  }, [urlCategory, form]);

  // Attribute save function using the above error handler
  const handleAttributeSave = async (
    categoryName: CategoryName,
    variationId: string,
    attributes: Record<string, unknown>
  ) => {
    try {
      // Get the schema for validation based on category name
      const schema = attributeSchemaMap[categoryName];

      // Validate the attributes using the schema
      const validatedAttributes = schema.parse(attributes);

      const input = {
        productVariationId: variationId,
        attributes: validatedAttributes,
      };

      // Mutate based on category (handle specific mutations for each category)
      switch (categoryName) {
        case "t-shirt":
          return await mutations.tShirtMutation.mutateAsync(input as any);
        case "pant":
          return await mutations.pantMutation.mutateAsync(input as any);
        case "shoe":
          return await mutations.shoeMutation.mutateAsync(input as any);
        case "shirt":
          return await mutations.shirtMutation.mutateAsync(input as any);
        case "jacket":
          return await mutations.jacketMutation.mutateAsync(input as any);
        case "undergarment":
          return await mutations.undergarmentMutation.mutateAsync(input as any);
        case "generic":
          return await mutations.genericMutation.mutateAsync(input as any);
        default:
          throw new Error(`Unsupported category: ${categoryName}`);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const onSubmit = async (values: FormSchema) => {
    try {
      if (!productId) {
        throw new Error("Invalid product ID");
      }

      for (const [index, variation] of values.variations.entries()) {
        const variationImages =
          await variationImageRefs.current?.triggerUpload();

        if (!variationImages || Array.isArray(variationImages)) {
          handleError("Variation images are invalid");
        }

        const createdVariation = await createProductVariation.mutateAsync({
          productId,
          image: Array.isArray(variationImages)
            ? variationImages
            : [variationImages ?? ""],
          price: variation.price,
          stock: variation.stock,
          size: variation.size,
          color: variation.color,
          // @ts-ignore
          gender: variation?.gender,
          // @ts-ignore
          ageRange: variation?.ageRange,
          modelNumber: variation.modelNumber,
          warranty: variation.warranty,
          attributes: variation.attributes,
        });

        // await handleAttributeSave(
        //   values.categoryName,
        //   createdVariation.id,
        //   variation.attributes
        // );

        try {
          await handleAttributeSave(
            values.categoryName,
            createdVariation.id,
            variation.attributes
          );
        } catch (attributeError) {
          // Rollback: Delete the variation if attribute creation fails
          await deleteProductVariation.mutateAsync({
            id: createdVariation.id,
          });
        }
      }

      form.reset();
      toast.success("Variation and attributes created successfully");
    } catch (error) {
      handleError(error);
    }
  };

  const selectedCategory = form.watch("categoryName");

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Variation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border p-4 mb-4">
                  <p className="mb-2 font-medium">Variation {index + 1}</p>

                  <FormField
                    control={form.control}
                    name={`variations.${index}.price`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value, 10);
                              field.onChange(Number.isNaN(value) ? "" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variations.${index}.stock`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value, 10);
                              field.onChange(Number.isNaN(value) ? "" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variations.${index}.size`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} placeholder="Size" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variations.${index}.color`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} placeholder="Color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variations.${index}.gender`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="UNISEX">Unisex</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variations.${index}.ageRange`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Age Range</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INFANT">Infant</SelectItem>
                              <SelectItem value="TODDLER">Toddler</SelectItem>
                              <SelectItem value="KIDS">Kids</SelectItem>
                              <SelectItem value="TEENS">Teens</SelectItem>
                              <SelectItem value="ADULTS">Adults</SelectItem>
                              <SelectItem value="SENIORS">Seniors</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <AttributeFields
                    category={selectedCategory}
                    index={index}
                    control={form.control}
                  />

                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <FormControl>
                      <ImageUploader
                        ref={variationImageRefs}
                        value={productImage}
                        // onChange={(url) => setProductImage(url as string)}
                        multiple={false}
                        config={{
                          maxFiles: 3,
                          maxSizeInMB: 50,
                          folder: "product-images",
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-4"
                      onClick={() => remove(index)}
                    >
                      Remove Variation
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    append({
                      price: 0,
                      stock: 0,
                      size: "",
                      color: "",
                      gender: "",
                      ageRange: "",
                      attributes: {},
                    })
                  }
                >
                  Add Variation
                </Button>

                <div className="flex gap-4">
                  <Button type="submit">Save Variations</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
