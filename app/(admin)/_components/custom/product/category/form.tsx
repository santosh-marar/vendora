"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProductCategoryTable } from "./table";
import { createProductCategorySchema, ProductCategory } from "@/validation/product/category";
import { z } from "zod";

type CreateProductCategory = z.infer<typeof createProductCategorySchema>;

export function ProductCategoryForm() {
  const utils = api.useUtils();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getAllProductCategories = api.productCategory.getAll.useQuery();
  const createProductCategory = api.productCategory.create.useMutation();

  const form = useForm<CreateProductCategory>({
    resolver: zodResolver(createProductCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: null,
    },
  });

  useEffect(() => {
    if (getAllProductCategories.data) {
      setCategories(getAllProductCategories.data);
    }
  }, [getAllProductCategories.data]);

  async function onSubmit(values: CreateProductCategory) {
    setIsLoading(true);
    setError(null);
    try {
      await createProductCategory.mutateAsync(values);
      form.reset();
      utils.productCategory.getAll.invalidate();
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const getCategoryHierarchy = (categoryId: string | null): string[] => {
    const result: string[] = [];
    let currentId = categoryId;

    while (currentId) {
      const category = categories.find((c) => c.id === currentId);
      if (category) {
        result.unshift(category.name);
        currentId = category.parentId;
      } else {
        break;
      }
    }

    return result;
  };

  const getCategoryOptions = (
    parentId: string | null = null,
    level = 0
  ): React.ReactNode => {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((category) => (
        <React.Fragment key={category.id}>
          <SelectItem value={category.id as string}>
            {/* Use non-breaking spaces for indentation */}
            {"\u00A0".repeat(level * 3)}
            {category.name}
          </SelectItem>
          {/* Recursively render subcategories with increased indentation */}
          {getCategoryOptions(category.id, level + 1)}
        </React.Fragment>
      ));
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:space-x-4 lg:space-y-0">
        <Card className="w-full lg:w-1/3 rounded-sm">
          <CardHeader>
            <CardTitle>{"Add New Category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      {/* <FormLabel>Parent Category</FormLabel> */}
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : value)
                        }
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="none" value="none">
                            None (Top Level)
                          </SelectItem>
                          {getCategoryOptions()}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      {/* <FormLabel>New Category Name</FormLabel> */}
                      <FormControl>
                        <Input placeholder="New category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      {/* <FormLabel>Description</FormLabel> */}
                      <FormControl>
                        <Textarea
                          placeholder="Category description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && <div className="text-destructive">{error}</div>}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Add Category"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Table section */}
        <ProductCategoryTable />
      </div>
    </div>
  );
}
