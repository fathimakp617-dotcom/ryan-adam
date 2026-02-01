import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface PinCodeData {
  city: string;
  state: string;
  country: string;
}

interface PinCodeLookupResult {
  isLoading: boolean;
  error: string | null;
  data: PinCodeData | null;
  lookupPinCode: (pinCode: string) => Promise<PinCodeData | null>;
}

// India Post API response structure
interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Country: string;
}

interface IndiaPostResponse {
  Status: string;
  Message: string;
  PostOffice: PostOffice[] | null;
}

export const usePinCodeLookup = (): PinCodeLookupResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PinCodeData | null>(null);
  const { toast } = useToast();

  const lookupPinCode = useCallback(async (pinCode: string): Promise<PinCodeData | null> => {
    // Validate PIN code format (6 digits for India)
    const cleanPinCode = pinCode.replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleanPinCode)) {
      setError(null);
      setData(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use India Post public API
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPinCode}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch PIN code data");
      }

      const result: IndiaPostResponse[] = await response.json();

      if (result[0]?.Status === "Success" && result[0]?.PostOffice?.length > 0) {
        const postOffice = result[0].PostOffice[0];
        const pinData: PinCodeData = {
          city: postOffice.District,
          state: postOffice.State,
          country: postOffice.Country,
        };
        
        setData(pinData);
        setError(null);
        
        toast({
          title: "Address Auto-filled",
          description: `${pinData.city}, ${pinData.state}`,
          duration: 2000,
        });
        
        return pinData;
      } else {
        setError("Invalid PIN code");
        setData(null);
        toast({
          title: "Invalid PIN Code",
          description: "Please enter a valid 6-digit Indian PIN code",
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }
    } catch (err) {
      const errorMessage = "Unable to lookup PIN code";
      setError(errorMessage);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { isLoading, error, data, lookupPinCode };
};

export default usePinCodeLookup;
