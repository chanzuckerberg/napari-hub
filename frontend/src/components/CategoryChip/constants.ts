import { FilterCategoryKeys } from '@/store/search/search.store';
import { HubDimension } from '@/types';

export const STATE_KEY_MAP: Partial<Record<HubDimension, FilterCategoryKeys>> =
  {
    'Image modality': 'imageModality',
    'Workflow step': 'workflowStep',
  };
