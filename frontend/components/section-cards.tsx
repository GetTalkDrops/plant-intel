"use client";

import { useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  const [expandedCards, setExpandedCards] = useState({
    revenue: false,
    customers: false,
    accounts: false,
    growth: false,
  });

  const toggleCard = (cardName: keyof typeof expandedCards) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Card 1 - Total Revenue */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction className="flex flex-col gap-2 items-end">
            <Badge
              variant="outline"
              className="border-green-500 text-green-700 bg-green-50"
            >
              <IconTrendingUp className="text-green-600" />
              +12.5%
            </Badge>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Sparkles className="h-3 w-3" />
              Ask AI
            </button>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month{" "}
            <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>

        {expandedCards.revenue && (
          <div className="px-6 pb-4">
            <div className="w-full space-y-3 pt-2 border-t">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Metrics</h4>
                <p className="text-muted-foreground text-xs">
                  Production output increased 12.5% YoY. Daily throughput
                  averaging 1,850 units with 98.2% quality pass rate.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Narrative
                </h4>
                <p className="text-muted-foreground text-xs">
                  Manufacturing efficiency gains driven by new assembly line
                  optimization and reduced changeover times on Line 3.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Root Cause/Correlations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Implementation of lean manufacturing principles and automated
                  quality control systems reduced waste by 15%.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Recommendations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Expand automation to Lines 1 and 2. Consider second shift to
                  maximize capacity utilization during peak demand.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => toggleCard("revenue")}
          className="w-full py-2 flex items-center justify-center border-t hover:bg-gray-50 transition-colors"
        >
          {expandedCards.revenue ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </Card>

      {/* Card 2 - New Customers */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction className="flex flex-col gap-2 items-end">
            <Badge
              variant="outline"
              className="border-red-500 text-red-700 bg-red-50"
            >
              <IconTrendingDown className="text-red-600" />
              -20%
            </Badge>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Sparkles className="h-3 w-3" />
              Ask AI
            </button>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period{" "}
            <IconTrendingDown className="size-4 text-red-600" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>

        {expandedCards.customers && (
          <div className="px-6 pb-4">
            <div className="w-full space-y-3 pt-2 border-t">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Metrics</h4>
                <p className="text-muted-foreground text-xs">
                  New orders down 20% with average order value at $12,450. Lead
                  time extended to 6 weeks from 4 weeks.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Narrative
                </h4>
                <p className="text-muted-foreground text-xs">
                  Supply chain disruptions and raw material shortages impacting
                  delivery commitments and customer acquisition.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Root Cause/Correlations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Steel supplier capacity constraints coinciding with increased
                  competitor activity in key markets.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Recommendations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Diversify supplier base, improve demand forecasting, and
                  enhance customer communication about realistic lead times.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => toggleCard("customers")}
          className="w-full py-2 flex items-center justify-center border-t hover:bg-gray-50 transition-colors"
        >
          {expandedCards.customers ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </Card>

      {/* Card 3 - Active Accounts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction className="flex flex-col gap-2 items-end">
            <Badge
              variant="outline"
              className="border-green-500 text-green-700 bg-green-50"
            >
              <IconTrendingUp className="text-green-600" />
              +12.5%
            </Badge>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Sparkles className="h-3 w-3" />
              Ask AI
            </button>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention{" "}
            <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>

        {expandedCards.accounts && (
          <div className="px-6 pb-4">
            <div className="w-full space-y-3 pt-2 border-t">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Metrics</h4>
                <p className="text-muted-foreground text-xs">
                  Active production lines at 95% capacity. Equipment uptime at
                  94.3% with scheduled maintenance on track.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Narrative
                </h4>
                <p className="text-muted-foreground text-xs">
                  Preventive maintenance program showing excellent results with
                  minimal unplanned downtime across all facilities.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Root Cause/Correlations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Investment in predictive maintenance technology and operator
                  training programs reducing equipment failures.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Recommendations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Continue current maintenance schedule. Budget for equipment
                  upgrades in Q2 to sustain performance levels.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => toggleCard("accounts")}
          className="w-full py-2 flex items-center justify-center border-t hover:bg-gray-50 transition-colors"
        >
          {expandedCards.accounts ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </Card>

      {/* Card 4 - Growth Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction className="flex flex-col gap-2 items-end">
            <Badge
              variant="outline"
              className="border-green-500 text-green-700 bg-green-50"
            >
              <IconTrendingUp className="text-green-600" />
              +4.5%
            </Badge>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Sparkles className="h-3 w-3" />
              Ask AI
            </button>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase{" "}
            <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>

        {expandedCards.growth && (
          <div className="px-6 pb-4">
            <div className="w-full space-y-3 pt-2 border-t">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Metrics</h4>
                <p className="text-muted-foreground text-xs">
                  Quarter-over-quarter growth steady at 4.5%. Workforce
                  productivity up 8% with defect rate down to 1.8%.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Narrative
                </h4>
                <p className="text-muted-foreground text-xs">
                  Sustainable growth trajectory maintained through balanced
                  capacity expansion and quality improvements.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Root Cause/Correlations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Cross-training programs and process standardization
                  initiatives yielding consistent performance gains.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Recommendations
                </h4>
                <p className="text-muted-foreground text-xs">
                  Maintain current growth pace. Explore strategic partnerships
                  to access new markets while preserving quality standards.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => toggleCard("growth")}
          className="w-full py-2 flex items-center justify-center border-t hover:bg-gray-50 transition-colors"
        >
          {expandedCards.growth ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </Card>
    </div>
  );
}
