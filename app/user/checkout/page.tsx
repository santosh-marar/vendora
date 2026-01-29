"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, CreditCard, Truck } from "lucide-react";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { handleError } from "@/lib/zod-error";
import SecondaryNavbar from "@/components/custom/secondary-navbar";
import Link from "next/link";

const shippingSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber1: z.string().min(1, "Phone number is required"),
  phoneNumber2: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().optional(),
  village: z.string().optional(),
  street: z.string().min(1, "Street is required"),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

interface ProductVariation {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  warranty: string | null;
  ageRange: string | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
  image: string[];
}

interface CartItem {
  cartId: string;
  productId: string;
  productVariationId: string;
  product: {
    id: string;
    name: string;
    description: string;
    brand: string | null;
    categoryId: string;
    image: string;
    material: string | null;
    shopId: string;
  };
  productVariation: ProductVariation;
  quantity: number;
  totalPrice: number;
  totalDiscountPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "ESEWA" | "KHALTI"
  >("CASH_ON_DELIVERY");
  const { data, isLoading: isLoadingCart } = api.cart.getCart.useQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  const cartItems = data?.items;

  const { mutate: createOrder } = api.order.create.useMutation();

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      phoneNumber1: "",
      addressLine1: "",
      country: "",
      state: "",
      district: "",
      street: "",
    },
  });

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const calculateShippingCost = (items: CartItem[]) => {
    // Example shipping cost calculation
    const baseShipping = 0; // Flat shipping rate
    const perItemCost = 0; // Additional cost per item
    return baseShipping + items.length * perItemCost;
  };

  const calculateTax = (subTotal: number, taxRate = 0) => {
    // Assuming tax rate is 10% (0.1)
    return subTotal * taxRate;
  };

  const onSubmit: SubmitHandler<ShippingFormData> = (data) => {
    if (!cartItems) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Calculate subTotal by summing totalPrice of all cart items
    const subTotal = calculateTotal(cartItems);

    // Calculate shipping cost dynamically (you can adjust the logic here)
    const shippingCost = calculateShippingCost(cartItems);

    // Calculate tax dynamically based on subTotal
    const tax = calculateTax(subTotal);

    // Prepare order data
    const orderData = {
      shippingAddress: data,
      paymentMethod,
      items: cartItems.map((item) => ({
        productId: item.productId,
        productVariationId: item.productVariationId,
        quantity: item.quantity,
        price: item.totalPrice,
      })),
      subTotal, // Calculated subTotal
      shippingCost, // Calculated shipping cost
      tax, // Calculated tax
      total: subTotal + shippingCost + tax, // Final total
      notes: data.notes,
    };

    createOrder(orderData, {
      onSuccess: (data) => {
        toast.success("Order created placed successfully");
        router.push("/user/order");
        setIsSubmitting(false);
      },
      onError: (error) => {
        handleError(error);
        setIsSubmitting(false);
      },
    });
  };

  if (isLoadingCart) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading cart items...
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        Your cart is empty.
      </div>
    );
  }

  return (
    <>
      <SecondaryNavbar pageName="Checkout"/>
      <div className="container mx-auto px-4 py-20">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="lg:flex lg:gap-12"
          >
            <div className="lg:w-2/3">
              {/* Shipping Information */}
              <div className="bg-background p-6 rounded-lg mb-6 max-w-2xl border border-gray-900 ">
                <h2 className="text-2xl font-semibold mb-4">
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number 1</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="village"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Village (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Any special instructions for your order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-background p-6 rounded-lg shadow-2xs mb-6">
                <h2 className="text-2xl font-semibold mb-4">Payment Method</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(
                    value: "CASH_ON_DELIVERY" | "ESEWA" | "KHALTI"
                  ) => setPaymentMethod(value)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="CASH_ON_DELIVERY" id="cash" />
                    <Label htmlFor="cash">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="ESEWA" id="esewa" disabled />
                    <Label htmlFor="esewa" className="text-muted-foreground">
                      eSewa (Coming Soon)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="KHALTI" id="khalti" disabled />
                    <Label htmlFor="khalti" className="text-muted-foreground">
                      Khalti (Coming Soon)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="lg:w-1/3">
              {/* Order Summary */}
              <div className="bg-background p-6 rounded-lg shadow-2xs">
                <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-4 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 shrink-0 cursor-pointer">
                        <Link
                          href={`/product/${item.product.id}`}
                          className="block"
                        >
                          <Image
                            src={item.product.image || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-md transition-transform hover:scale-105"
                          />
                        </Link>
                      </div>
                      <div className="grow">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold">
                        रु. {item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>रु. {calculateTotal(cartItems).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>
                      रु. {calculateShippingCost(cartItems).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>
                      रु. {calculateTax(calculateTotal(cartItems)).toFixed(2)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      रु.
                      {(
                        calculateTotal(cartItems) +
                        calculateShippingCost(cartItems) +
                        calculateTax(calculateTotal(cartItems))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={isSubmitting}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Processing..." : "Place Order"}
                </Button>
                {errorMessage && (
                  <p className="mt-4 text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
                <Button type="button" variant="outline" className="w-full mt-4">
                  <Link href="/user/cart" className="flex items-center">
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    <span>Go to Cart</span>
                  </Link>
                </Button>
                {/* <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center">
                <Truck className="mr-2 h-4 w-4" />
                Free shipping on orders over रु. 100
              </p> */}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
