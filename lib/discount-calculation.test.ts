import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscountPrice } from "./discount-calculation";

test("percentage discount over 100% never yields a negative price", () => {
  const price = calculateDiscountPrice(100, {
    discountType: "PERCENTAGE",
    value: 350,
  });
  assert.equal(price, 0);
});

test("percentage discount still applies normally", () => {
  assert.equal(
    calculateDiscountPrice(200, { discountType: "PERCENTAGE", value: 25 }),
    150
  );
});
