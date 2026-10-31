export const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Request sent", cls: "bg-[#fdefd0] text-[#6b4200]" },
  dispatching: { label: "Finding professionals", cls: "bg-[#fdefd0] text-[#6b4200]" },
  offers_received: { label: "Offers received", cls: "bg-[#d9efe8] text-[#0a4a40]" },
  confirmed: { label: "Confirmed", cls: "bg-[#d9efe8] text-[#0a4a40]" },
  on_the_way: { label: "On the way", cls: "bg-[#d9efe8] text-[#0a4a40]" },
  in_progress: { label: "In progress", cls: "bg-[#d9efe8] text-[#0a4a40]" },
  completed: { label: "Completed", cls: "bg-gray-200 text-gray-700" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};

export const refNo = (id: number) => `KH-${String(id).padStart(6, "0")}`;