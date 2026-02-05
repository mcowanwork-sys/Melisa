
export interface NarrationTemplate {
  id: string;
  category: string;
  subCategory: string;
  type: string;
  description: string;
}

export interface NarrationCategory {
  name: string;
  templates: NarrationTemplate[];
}

export interface UserInputs {
  placeholders: Record<string, string>;
  additionalNotes: string;
  isUrgent: boolean;
  urgencyFee: string;
  includeTimeSpent: boolean;
  timeSpentDetails: string;
}
