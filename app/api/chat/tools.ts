import { tool } from 'ai';
import { z } from 'zod';

const inventory = {
  '94107': [
    {
      id: 'bk-001',
      name: 'Mission District Daypack',
      price: 72,
      vendor: 'Mission Gear Co.',
      distance: '1.2 miles',
    },
    {
      id: 'bk-002',
      name: 'SOMA Commuter Bag',
      price: 85,
      vendor: 'SOMA Outfitters',
      distance: '2.0 miles',
    },
  ],
  '10001': [
    {
      id: 'bk-101',
      name: 'Hudson Canvas Backpack',
      price: 68,
      vendor: 'Chelsea Outdoor Supply',
      distance: '0.8 miles',
    },
    {
      id: 'bk-102',
      name: 'Midtown Urban Pack',
      price: 95,
      vendor: 'Midtown Urban Outfitters',
      distance: '1.5 miles',
    },
  ],
};

export const tools = {
  searchLocalBackpacks: tool({
    description:
      'find locally available backpacks that match the provided zip code and vendor preference',
    inputSchema: z.object({
      zipCode: z.string().describe('US ZIP code to search near'),
      vendorPreference: z
        .string()
        .optional()
        .describe('Optional preference such as local vendor, national chain, etc.'),
    }),
    outputSchema: z.string(),
    async execute({ zipCode, vendorPreference }) {
      const normalizedZip = zipCode.trim();
      const results =
        inventory[normalizedZip as keyof typeof inventory] ?? inventory['94107'];

      const filtered = vendorPreference
        ? results.filter(result =>
            result.vendor.toLowerCase().includes(vendorPreference.toLowerCase()),
          ) || results
        : results;

      return JSON.stringify({
        zipCode: normalizedZip,
        vendorPreference,
        options: filtered,
        note:
          'Provide the option id when you want to purchase one of these backpacks.',
      });
    },
  }),
  initiatePurchase: tool({
    description:
      'final confirmation step that charges the customer. Must only be called after the user selects a backpack. Requires human approval.',
    inputSchema: z.object({
      itemId: z.string(),
      price: z.number(),
      vendor: z.string(),
      zipCode: z.string(),
    }),
    outputSchema: z.string(),
  }),
};

