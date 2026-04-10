import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProgramSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["program-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!settings?.id) throw new Error("No settings row found");
      const { error } = await supabase
        .from("program_settings")
        .update(updates)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-settings"] });
      toast.success("Settings saved!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  return { settings, isLoading, updateSettings };
};
