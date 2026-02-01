import { useState, useCallback, useRef } from "react";

interface PinCodeData {
  city: string;
  state: string;
  country: string;
  postOffice: string;
}

interface PinCodeLookupResult {
  isLoading: boolean;
  lookupPinCode: (pinCode: string) => Promise<PinCodeData | null>;
}

// Simple cache to avoid repeated API calls
const pinCodeCache = new Map<string, PinCodeData>();

export const usePinCodeLookup = (): PinCodeLookupResult => {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const lookupPinCode = useCallback(async (pinCode: string): Promise<PinCodeData | null> => {
    const cleanPinCode = pinCode.replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleanPinCode)) {
      return null;
    }

    // Check cache first
    if (pinCodeCache.has(cleanPinCode)) {
      return pinCodeCache.get(cleanPinCode)!;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPinCode}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) return null;

      const result = await response.json();

      if (result[0]?.Status === "Success" && result[0]?.PostOffice?.length > 0) {
        const postOffice = result[0].PostOffice[0];
        const pinData: PinCodeData = {
          city: postOffice.District,
          state: postOffice.State,
          country: postOffice.Country,
          postOffice: postOffice.Name,
        };
        
        // Cache the result
        pinCodeCache.set(cleanPinCode, pinData);
        return pinData;
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, lookupPinCode };
};

export default usePinCodeLookup;
