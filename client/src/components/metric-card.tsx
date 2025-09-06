import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-primary",
  valueColor = ""
}: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${valueColor}`} data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
        </div>
        <div className={`h-12 w-12 bg-${iconColor.split('-')[1]}/10 rounded-full flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
