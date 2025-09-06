import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const leaveRequestSchema = z.object({
  leaveType: z.enum(["sick", "vacation", "personal", "emergency"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export default function LeaveRequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: "vacation",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: LeaveRequestFormData) => {
      const response = await apiRequest("POST", "/api/leave-requests", {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeaveRequestFormData) => {
    createLeaveRequestMutation.mutate(data);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="leaveType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-leave-type">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      data-testid="input-start-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      data-testid="input-end-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Reason for leave..."
                    {...field}
                    data-testid="textarea-reason"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createLeaveRequestMutation.isPending}
            data-testid="button-submit-leave"
          >
            {createLeaveRequestMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
