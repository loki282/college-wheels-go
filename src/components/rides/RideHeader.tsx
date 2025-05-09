
import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface RideHeaderProps {
  fromLocation: string;
  toLocation: string;
  date: string;
  time: string;
  status: string;
}

export function RideHeader({ fromLocation, toLocation, date, time, status }: RideHeaderProps) {
  const formattedDate = date ? format(new Date(date), "MMM d, yyyy") : "N/A";
  const formattedTime = time ? time.substring(0, 5) : "N/A";

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold">{fromLocation} → {toLocation}</h3>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <span>{formattedDate} • {formattedTime}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let badgeClass = "";
  let statusText = status || "Unknown";
  
  switch (status?.toLowerCase()) {
    case "active":
      badgeClass = "bg-limegreen text-white";
      statusText = "Active";
      break;
    case "completed":
      badgeClass = "bg-electricblue";
      statusText = "Completed";
      break;
    case "cancelled":
      badgeClass = "bg-destructive";
      statusText = "Cancelled";
      break;
    case "pending":
      badgeClass = "bg-taxiyellow text-charcoal";
      statusText = "Pending";
      break;
    default:
      badgeClass = "bg-muted";
      break;
  }

  return (
    <Badge className={badgeClass}>
      {statusText}
    </Badge>
  );
}
