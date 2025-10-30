import { ToolSet, UIMessage } from 'ai';

export type HumanInTheLoopUIMessage = UIMessage;

export type MyTools = {
  searchLocalBackpacks: {
    input: { zipCode: string; vendorPreference?: string };
    output: string;
  };
  initiatePurchase: {
    input: { itemId: string; price: number; vendor: string; zipCode: string };
    output: string;
  };
};

