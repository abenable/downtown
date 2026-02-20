import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils";
import {
  FulfillmentOption,
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceContext,
  CreateFulfillmentResult,
  ValidateFulfillmentDataContext,
} from "@medusajs/types";

class DowntownFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "downtown-fulfillment";

  constructor() {
    super();
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "pickup-station",
        name: "Pickup Station",
      },
      {
        id: "door-delivery",
        name: "Door Delivery",
      },
    ];
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext,
  ): Promise<Record<string, unknown>> {
    return data;
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return true;
  }

  async canCalculate(): Promise<boolean> {
    // Always return true - we handle all calculation logic in calculatePrice
    return true;
  }

  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext,
  ): Promise<CalculatedShippingOptionPrice> {
    // Check for door-delivery in various places
    const optionId = (optionData?.id || data?.id || optionData?.code) as string;

    if (optionId === "door-delivery") {
      // Calculate 5% of cart total
      const cart = context.cart as any;
      let cartTotal = 0;

      if (cart?.items) {
        cartTotal = cart.items.reduce((sum: number, item: any) => {
          return sum + (item.unit_price || 0) * (item.quantity || 1);
        }, 0);
      }

      // 5% of cart total with minimum of 5000 UGX
      const deliveryFee = Math.max(Math.round(cartTotal * 0.05), 5000);

      return {
        calculated_amount: deliveryFee,
        is_calculated_price_tax_inclusive: false,
      };
    }

    // Pickup station - flat rate 2000 UGX
    return {
      calculated_amount: 2000,
      is_calculated_price_tax_inclusive: false,
    };
  }

  async createFulfillment(): Promise<CreateFulfillmentResult> {
    return {
      data: {},
      labels: [],
    };
  }

  async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<void> {
    return;
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return {
      data: {},
      labels: [],
    };
  }
}

export default DowntownFulfillmentService;
