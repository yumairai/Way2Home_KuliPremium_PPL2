/**
 * Hook to detect if current user is in test mode
 * Reads is_test_user flag from profiles table
 */

import { useTestModeContext } from "@/context/TestModeContext";

export function useTestMode() {
  const isTestMode = useTestModeContext();
  return {
    isTestMode: isTestMode === true,
    loading: isTestMode === null,
  };
}
