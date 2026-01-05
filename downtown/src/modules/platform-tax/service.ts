import { ITaxProvider, TaxTypes } from "@medusajs/framework/types";

/**
 * Platform Fee Tax Provider
 *
 * Calculates the platform fee (10%) as a tax on marketplace orders.
 * This replaces the commission module with Medusa's built-in tax system.
 */
export default class PlatformFeeTaxProvider implements ITaxProvider {
  static identifier = "platform-fee";

  private platformFeeRate: number;

  constructor(
    _dependencies: Record<string, unknown>,
    options?: { rate?: number }
  ) {
    // Default 10% platform fee, configurable via options
    this.platformFeeRate = options?.rate ?? 10;
  }

  getIdentifier(): string {
    return PlatformFeeTaxProvider.identifier;
  }

  async getTaxLines(
    itemLines: TaxTypes.ItemTaxCalculationLine[],
    shippingLines: TaxTypes.ShippingTaxCalculationLine[],
    _context: TaxTypes.TaxCalculationContext
  ): Promise<(TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[]> {
    const taxLines: (TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[] =
      [];

    // Apply platform fee to each line item
    for (const itemLine of itemLines) {
      taxLines.push({
        rate_id: undefined,
        rate: this.platformFeeRate,
        name: "Platform Fee",
        code: "PLATFORM_FEE",
        line_item_id: itemLine.line_item.id,
        provider_id: this.getIdentifier(),
      });
    }

    // Optionally apply platform fee to shipping (can be disabled)
    for (const shippingLine of shippingLines) {
      taxLines.push({
        rate_id: undefined,
        rate: this.platformFeeRate,
        name: "Platform Fee",
        code: "PLATFORM_FEE",
        shipping_line_id: shippingLine.shipping_line.id,
        provider_id: this.getIdentifier(),
      });
    }

    return taxLines;
  }
}
