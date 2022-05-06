import { useTranslation } from 'next-i18next';

import { useLoadingState } from '@/context/loading';

/**
 * Hook that gets a map of categories to category groups for the workflow step
 * filter. This will return a dictionary that looks like:
 *
 * ```ts
 * {
 *   Clustering: 'Object-based analysis'
 *   'Filament tracing': 'Image segmentation & object detection'
 *   'Fluorescence correlation spectroscopy': 'Image-based analysis'
 *   'Frequency domain analysis': 'Image-based analysis',
 *    ...,
 * }
 *
 * This is used so that the autocomplete complete can get the associated group
 * name given a specific category.
 * ```
 */
export function useWorkflowStepGroups() {
  const [t] = useTranslation(['common', 'homePage']);
  const isLoading = useLoadingState();

  if (isLoading) {
    return {};
  }

  const {
    // `groups` is a map of group keys to group labels. The group labels are
    // used for rendering the name of the group in the user's language.
    groups,

    // `groupings` is a map that associates group keys to string arrays of
    // category keys. The string array contains the categories that are
    // associated with a specific group.
    groupings,
  } = t('homePage:filter.workflowStep');

  const groupMap: Record<string, string> = {};

  for (const [groupNameKey, categories] of Object.entries(groupings)) {
    // Get label for group in user's language.
    const groupName = groups[groupNameKey as keyof typeof groups];

    for (const category of categories) {
      // Associate group with a specific group name.
      groupMap[category] = groupName;
    }
  }

  return groupMap;
}
