"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DiscountScope, DiscountType } from "@prisma/client";
import { api } from "@/trpc/react";
import { handleError } from "@/lib/zod-error";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getShop } from "@/lib/database";

// Form schema
const formSchema = z
  .object({
    name: z.string().min(1, "Discount name is required"),
    description: z.string().optional(),
    discountType: z.nativeEnum(DiscountType),
    discountScope: z.nativeEnum(DiscountScope),
    value: z.number().positive("Value must be positive"),
    minPurchase: z.number().positive("Minimum purchase must be positive").optional(),
    minItems: z.number().int().positive("Minimum items must be a positive integer").optional(),
    usageLimit: z.number().int().positive("Usage limit must be a positive integer").optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional().nullable(),
    isActive: z.boolean(),
    allowStacking: z.boolean(),
    priority: z.number().int().positive("Priority must be a positive integer"),
    buyQuantity: z.number().int().positive("Buy quantity must be a positive integer").optional(),
    getQuantity: z.number().int().positive("Get quantity must be a positive integer").optional(),
    appliedToProductId: z.string().optional(),
    autoApply: z.boolean(),
  })
  .refine(
    (data) => {
      // BOGO validation
      if (data.discountType === DiscountType.BUY_X_GET_Y) {
        return (
          !!data.buyQuantity &&
          !!data.getQuantity &&
          data.discountScope === DiscountScope.PRODUCT &&
          !!data.appliedToProductId
        );
      }
      return true;
    },
    {
      message:
        "BOGO discounts require buyQuantity, getQuantity, and a specific product",
      path: ["discountType"],
    }
  );

export default function CreateDiscountForm() {
  const [open, setOpen] = useState(false);

  const session = useSession();
  const userId = session?.data?.user?.id;

  const utils = api.useUtils();

  const createProduct = api.product.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      // router.push("/products");
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const { mutate: createDiscount, } = api.discount.create.useMutation(
    {
      onSuccess: () => {
        toast.success("Discount created successfully");
      },
      onError: (error: any) => {
        handleError(error);
      },
    }
  );

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      discountType: DiscountType.PERCENTAGE,
      discountScope: DiscountScope.CART,
      value: 0,
      isActive: true,
      allowStacking: false,
      priority: 1,
      autoApply: false,
    },
  });

  // Watch for discount type changes to show/hide fields
  const discountType = form.watch("discountType");
  const discountScope = form.watch("discountScope");
  const isBogoDiscount = discountType === DiscountType.BUY_X_GET_Y;

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const shop = await getShop(userId as string);
    createDiscount({
      ...values,
      shopId: shop?.id as string,
    });
  }

  return (
    <Card className="w-[90%] m-16 mx-auto mt-8 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Create Discount</CardTitle>
        <CardDescription>
          Create a new discount for your shop. Configure the discount type,
          value, and conditions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 flex gap-8 flex-col md:flex-row"
          >
            <div>
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="grid grid-cols-1  gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Sale" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the discount"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={DiscountType.PERCENTAGE}>
                              Percentage
                            </SelectItem>
                            <SelectItem value={DiscountType.FIXED_AMOUNT}>
                              Fixed Amount
                            </SelectItem>
                            {/* <SelectItem value={DiscountType.BUY_X_GET_Y}>
                              Buy X Get Y (BOGO)
                            </SelectItem> */}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {discountType === DiscountType.PERCENTAGE
                            ? "Percentage off the original price"
                            : discountType === DiscountType.FIXED_AMOUNT
                            ? "Fixed amount off the original price"
                            : "Buy X quantity and get Y quantity for the discount"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountScope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Scope</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          // disabled={isBogoDiscount}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select discount scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* <SelectItem value={DiscountScope.CART}>
                              Entire Cart
                            </SelectItem> */}
                            <SelectItem value={DiscountScope.PRODUCT}>
                              Specific Product
                            </SelectItem>
                            {/* <SelectItem value={DiscountScope.SHIPPING}>
                              Shipping
                            </SelectItem> */}
                          </SelectContent>
                        </Select>
                        {/* <FormDescription>
                          {isBogoDiscount &&
                            "BOGO discounts must target a specific product"}
                        </FormDescription> */}
                        <FormDescription>
                          Select a discount type
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {discountType === DiscountType.PERCENTAGE
                            ? "Discount Percentage (%)"
                            : discountType === DiscountType.FIXED_AMOUNT
                            ? "Discount Amount"
                            : "Discount Value"}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>
                          {discountType === DiscountType.PERCENTAGE
                            ? "Enter percentage value (e.g., 10 for 10% off)"
                            : "Enter amount value"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* {discountScope === DiscountScope.PRODUCT || isBogoDiscount ? (
                    <FormField
                      control={form.control}
                      name="appliedToProductId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Applied Product</FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={open}
                                  className={cn(
                                    "justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? mockProducts.find(
                                        (product) => product.id === field.value
                                      )?.name
                                    : "Select product"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                              <Command>
                                <CommandInput placeholder="Search products..." />
                                <CommandList>
                                  <CommandEmpty>No product found.</CommandEmpty>
                                  <CommandGroup>
                                    {mockProducts.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => {
                                          form.setValue(
                                            "appliedToProductId",
                                            product.id
                                          );
                                          setOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            product.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {product.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null} */}
                </div>

                {isBogoDiscount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="buyQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buy Quantity (X)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Number of items customer must buy
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="getQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Get Quantity (Y)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Number of items customer will get at discount
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Conditions Section */}
              <div className="space-y-6 mt-8">
                <Separator />
                <h3 className="text-lg font-medium">Conditions</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="minPurchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Purchase Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum cart value required (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minItems"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Items</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum number of items required (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "Select date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the discount becomes active (defaults to now)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "No end date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the discount expires (leave empty for no
                          expiration)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Unlimited"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of times this discount can be used
                        (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Advanced Settings Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Advanced Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Enable or disable this discount
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoApply"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Auto Apply
                          </FormLabel>
                          <FormDescription>
                            Automatically apply this discount when conditions
                            are met
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="allowStacking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow Stacking
                          </FormLabel>
                          <FormDescription>
                            Allow this discount to be combined with other
                            discounts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Higher priority discounts are applied first (1 is
                          lowest)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Create Discount
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
