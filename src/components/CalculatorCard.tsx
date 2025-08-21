import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export const CalculatorCard = ({ title, description, icon: Icon, children, className }: CalculatorCardProps) => {
  return (
    <Card className={`shadow-medium hover:shadow-strong transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};