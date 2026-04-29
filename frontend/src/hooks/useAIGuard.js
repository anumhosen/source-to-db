import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

export function useAIGuard() {
  const { apiKey } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();

  const checkAPIKey = useCallback(
    (showToast = true) => {
      if (!apiKey) {
        if (showToast) {
          toast.apiError('Please configure your Gemini API key to use AI features.');
        }
        return false;
      }
      return true;
    },
    [apiKey, toast],
  );

  const guardAction = useCallback(
    async (action, options = {}) => {
      const { showError = true } = options;

      if (!checkAPIKey(showError)) {
        return null;
      }

      try {
        return await action();
      } catch (error) {
        if (showError) {
          if (error.message?.includes('API not configured') || error.message?.includes('API key')) {
            toast.apiError('API key is missing or invalid. Please check your settings.');
          } else {
            toast.error(`AI operation failed: ${error.message}`);
          }
        }
        throw error;
      }
    },
    [checkAPIKey, toast],
  );

  return { checkAPIKey, guardAction };
}
