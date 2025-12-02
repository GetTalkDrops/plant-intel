"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IconDeviceFloppy, IconRefresh } from "@tabler/icons-react";

// Configuration presets
type PresetType = "conservative" | "balanced" | "aggressive";

interface AnalyzerConfig {
  // Cost Analyzer (15 variables)
  costVarianceThreshold: number;
  materialCostWeight: number;
  laborCostWeight: number;
  overheadCostWeight: number;
  minSampleSize: number;
  confidenceLevel: number;
  outlierDetectionSigma: number;
  seasonalAdjustment: boolean;
  inflationAdjustment: number;
  currencyConversion: boolean;
  baselineLookbackDays: number;
  trendAnalysisPeriod: number;
  savingsOpportunityMultiplier: number;
  riskTolerance: number;
  costEscalationRate: number;

  // Operations Analyzer (10 variables)
  cycleTimeThreshold: number;
  throughputWeight: number;
  qualityWeight: number;
  downtimeImpact: number;
  setupTimeWeight: number;
  batchSizeOptimization: boolean;
  scheduleEfficiencyTarget: number;
  bottleneckDetectionSensitivity: number;
  resourceUtilizationTarget: number;
  leadTimeVarianceThreshold: number;

  // Equipment Analyzer (8 variables)
  mtbfThreshold: number;
  mttrThreshold: number;
  oeeTarget: number;
  maintenanceCostWeight: number;
  downtimeCorrelationThreshold: number;
  equipmentAgeWeight: number;
  preventiveMaintenanceInterval: number;
  equipmentReliabilityScore: number;

  // Efficiency Analyzer (6 variables)
  laborEfficiencyTarget: number;
  materialUtilizationTarget: number;
  energyConsumptionWeight: number;
  wasteReductionTarget: number;
  processComplianceWeight: number;
  continuousImprovementFactor: number;
}

const PRESETS: Record<PresetType, AnalyzerConfig> = {
  conservative: {
    // Cost Analyzer
    costVarianceThreshold: 0.15,
    materialCostWeight: 0.4,
    laborCostWeight: 0.35,
    overheadCostWeight: 0.25,
    minSampleSize: 30,
    confidenceLevel: 0.95,
    outlierDetectionSigma: 3,
    seasonalAdjustment: true,
    inflationAdjustment: 0.03,
    currencyConversion: false,
    baselineLookbackDays: 90,
    trendAnalysisPeriod: 60,
    savingsOpportunityMultiplier: 0.5,
    riskTolerance: 0.1,
    costEscalationRate: 0.02,
    // Operations Analyzer
    cycleTimeThreshold: 0.2,
    throughputWeight: 0.4,
    qualityWeight: 0.35,
    downtimeImpact: 0.25,
    setupTimeWeight: 0.15,
    batchSizeOptimization: true,
    scheduleEfficiencyTarget: 0.85,
    bottleneckDetectionSensitivity: 0.7,
    resourceUtilizationTarget: 0.8,
    leadTimeVarianceThreshold: 0.15,
    // Equipment Analyzer
    mtbfThreshold: 720,
    mttrThreshold: 4,
    oeeTarget: 0.75,
    maintenanceCostWeight: 0.3,
    downtimeCorrelationThreshold: 0.7,
    equipmentAgeWeight: 0.2,
    preventiveMaintenanceInterval: 30,
    equipmentReliabilityScore: 0.9,
    // Efficiency Analyzer
    laborEfficiencyTarget: 0.8,
    materialUtilizationTarget: 0.85,
    energyConsumptionWeight: 0.2,
    wasteReductionTarget: 0.9,
    processComplianceWeight: 0.25,
    continuousImprovementFactor: 0.02,
  },
  balanced: {
    // Cost Analyzer
    costVarianceThreshold: 0.1,
    materialCostWeight: 0.4,
    laborCostWeight: 0.35,
    overheadCostWeight: 0.25,
    minSampleSize: 20,
    confidenceLevel: 0.9,
    outlierDetectionSigma: 2.5,
    seasonalAdjustment: true,
    inflationAdjustment: 0.03,
    currencyConversion: false,
    baselineLookbackDays: 60,
    trendAnalysisPeriod: 45,
    savingsOpportunityMultiplier: 0.7,
    riskTolerance: 0.15,
    costEscalationRate: 0.03,
    // Operations Analyzer
    cycleTimeThreshold: 0.15,
    throughputWeight: 0.4,
    qualityWeight: 0.35,
    downtimeImpact: 0.25,
    setupTimeWeight: 0.2,
    batchSizeOptimization: true,
    scheduleEfficiencyTarget: 0.88,
    bottleneckDetectionSensitivity: 0.75,
    resourceUtilizationTarget: 0.85,
    leadTimeVarianceThreshold: 0.12,
    // Equipment Analyzer
    mtbfThreshold: 600,
    mttrThreshold: 3,
    oeeTarget: 0.8,
    maintenanceCostWeight: 0.3,
    downtimeCorrelationThreshold: 0.75,
    equipmentAgeWeight: 0.25,
    preventiveMaintenanceInterval: 21,
    equipmentReliabilityScore: 0.85,
    // Efficiency Analyzer
    laborEfficiencyTarget: 0.85,
    materialUtilizationTarget: 0.88,
    energyConsumptionWeight: 0.25,
    wasteReductionTarget: 0.92,
    processComplianceWeight: 0.3,
    continuousImprovementFactor: 0.03,
  },
  aggressive: {
    // Cost Analyzer
    costVarianceThreshold: 0.05,
    materialCostWeight: 0.4,
    laborCostWeight: 0.35,
    overheadCostWeight: 0.25,
    minSampleSize: 15,
    confidenceLevel: 0.85,
    outlierDetectionSigma: 2,
    seasonalAdjustment: true,
    inflationAdjustment: 0.04,
    currencyConversion: false,
    baselineLookbackDays: 45,
    trendAnalysisPeriod: 30,
    savingsOpportunityMultiplier: 0.9,
    riskTolerance: 0.25,
    costEscalationRate: 0.04,
    // Operations Analyzer
    cycleTimeThreshold: 0.1,
    throughputWeight: 0.45,
    qualityWeight: 0.3,
    downtimeImpact: 0.25,
    setupTimeWeight: 0.25,
    batchSizeOptimization: true,
    scheduleEfficiencyTarget: 0.92,
    bottleneckDetectionSensitivity: 0.8,
    resourceUtilizationTarget: 0.9,
    leadTimeVarianceThreshold: 0.08,
    // Equipment Analyzer
    mtbfThreshold: 480,
    mttrThreshold: 2,
    oeeTarget: 0.85,
    maintenanceCostWeight: 0.35,
    downtimeCorrelationThreshold: 0.8,
    equipmentAgeWeight: 0.3,
    preventiveMaintenanceInterval: 14,
    equipmentReliabilityScore: 0.8,
    // Efficiency Analyzer
    laborEfficiencyTarget: 0.9,
    materialUtilizationTarget: 0.92,
    energyConsumptionWeight: 0.3,
    wasteReductionTarget: 0.95,
    processComplianceWeight: 0.35,
    continuousImprovementFactor: 0.05,
  },
};

interface AnalyzerConfigEditorProps {
  customerId: string;
  initialConfig?: Partial<AnalyzerConfig>;
  onSave?: (config: AnalyzerConfig) => void;
}

export function AnalyzerConfigEditor({
  customerId,
  initialConfig,
  onSave,
}: AnalyzerConfigEditorProps) {
  const [config, setConfig] = React.useState<AnalyzerConfig>(
    { ...PRESETS.balanced, ...initialConfig }
  );
  const [selectedPreset, setSelectedPreset] = React.useState<PresetType>("balanced");

  const applyPreset = (preset: PresetType) => {
    setConfig(PRESETS[preset]);
    setSelectedPreset(preset);
  };

  const handleSave = () => {
    onSave?.(config);
  };

  const updateConfig = (key: keyof AnalyzerConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Preset Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Presets</CardTitle>
          <CardDescription>
            Choose a preset or customize individual variables below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant={selectedPreset === "conservative" ? "default" : "outline"}
              className="h-auto flex-col items-start p-4"
              onClick={() => applyPreset("conservative")}
            >
              <span className="font-semibold mb-1">Conservative</span>
              <span className="text-xs text-muted-foreground">
                Lower risk, higher confidence thresholds
              </span>
            </Button>
            <Button
              variant={selectedPreset === "balanced" ? "default" : "outline"}
              className="h-auto flex-col items-start p-4"
              onClick={() => applyPreset("balanced")}
            >
              <span className="font-semibold mb-1">Balanced</span>
              <span className="text-xs text-muted-foreground">
                Moderate risk and opportunity detection
              </span>
            </Button>
            <Button
              variant={selectedPreset === "aggressive" ? "default" : "outline"}
              className="h-auto flex-col items-start p-4"
              onClick={() => applyPreset("aggressive")}
            >
              <span className="font-semibold mb-1">Aggressive</span>
              <span className="text-xs text-muted-foreground">
                Higher risk, maximum savings opportunities
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variable Editor Tabs */}
      <Tabs defaultValue="cost" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cost">
            Cost
            <Badge variant="secondary" className="ml-2">
              15
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="operations">
            Operations
            <Badge variant="secondary" className="ml-2">
              10
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="equipment">
            Equipment
            <Badge variant="secondary" className="ml-2">
              8
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="efficiency">
            Efficiency
            <Badge variant="secondary" className="ml-2">
              6
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Cost Analyzer Variables */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analyzer Configuration</CardTitle>
              <CardDescription>15 variables controlling cost analysis behavior</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costVarianceThreshold">Cost Variance Threshold</Label>
                <Input
                  id="costVarianceThreshold"
                  type="number"
                  step="0.01"
                  value={config.costVarianceThreshold}
                  onChange={(e) =>
                    updateConfig("costVarianceThreshold", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum variance % to flag as significant
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialCostWeight">Material Cost Weight</Label>
                <Input
                  id="materialCostWeight"
                  type="number"
                  step="0.01"
                  value={config.materialCostWeight}
                  onChange={(e) =>
                    updateConfig("materialCostWeight", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Weight for material costs (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCostWeight">Labor Cost Weight</Label>
                <Input
                  id="laborCostWeight"
                  type="number"
                  step="0.01"
                  value={config.laborCostWeight}
                  onChange={(e) =>
                    updateConfig("laborCostWeight", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Weight for labor costs (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overheadCostWeight">Overhead Cost Weight</Label>
                <Input
                  id="overheadCostWeight"
                  type="number"
                  step="0.01"
                  value={config.overheadCostWeight}
                  onChange={(e) =>
                    updateConfig("overheadCostWeight", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Weight for overhead costs (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minSampleSize">Minimum Sample Size</Label>
                <Input
                  id="minSampleSize"
                  type="number"
                  value={config.minSampleSize}
                  onChange={(e) =>
                    updateConfig("minSampleSize", parseInt(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum work orders for pattern detection
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidenceLevel">Confidence Level</Label>
                <Input
                  id="confidenceLevel"
                  type="number"
                  step="0.01"
                  value={config.confidenceLevel}
                  onChange={(e) =>
                    updateConfig("confidenceLevel", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Statistical confidence (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baselineLookbackDays">Baseline Lookback (Days)</Label>
                <Input
                  id="baselineLookbackDays"
                  type="number"
                  value={config.baselineLookbackDays}
                  onChange={(e) =>
                    updateConfig("baselineLookbackDays", parseInt(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Days to look back for baseline
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="savingsOpportunityMultiplier">
                  Savings Opportunity Multiplier
                </Label>
                <Input
                  id="savingsOpportunityMultiplier"
                  type="number"
                  step="0.1"
                  value={config.savingsOpportunityMultiplier}
                  onChange={(e) =>
                    updateConfig("savingsOpportunityMultiplier", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Multiplier for savings calculations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Analyzer Variables */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operations Analyzer Configuration</CardTitle>
              <CardDescription>
                10 variables controlling operations analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cycleTimeThreshold">Cycle Time Threshold</Label>
                <Input
                  id="cycleTimeThreshold"
                  type="number"
                  step="0.01"
                  value={config.cycleTimeThreshold}
                  onChange={(e) =>
                    updateConfig("cycleTimeThreshold", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Variance threshold for cycle times
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleEfficiencyTarget">
                  Schedule Efficiency Target
                </Label>
                <Input
                  id="scheduleEfficiencyTarget"
                  type="number"
                  step="0.01"
                  value={config.scheduleEfficiencyTarget}
                  onChange={(e) =>
                    updateConfig("scheduleEfficiencyTarget", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Target efficiency (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourceUtilizationTarget">
                  Resource Utilization Target
                </Label>
                <Input
                  id="resourceUtilizationTarget"
                  type="number"
                  step="0.01"
                  value={config.resourceUtilizationTarget}
                  onChange={(e) =>
                    updateConfig("resourceUtilizationTarget", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Target utilization (0-1)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Analyzer Variables */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Analyzer Configuration</CardTitle>
              <CardDescription>
                8 variables controlling equipment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mtbfThreshold">MTBF Threshold (hours)</Label>
                <Input
                  id="mtbfThreshold"
                  type="number"
                  value={config.mtbfThreshold}
                  onChange={(e) =>
                    updateConfig("mtbfThreshold", parseInt(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Mean time between failures threshold
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mttrThreshold">MTTR Threshold (hours)</Label>
                <Input
                  id="mttrThreshold"
                  type="number"
                  value={config.mttrThreshold}
                  onChange={(e) =>
                    updateConfig("mttrThreshold", parseInt(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Mean time to repair threshold
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oeeTarget">OEE Target</Label>
                <Input
                  id="oeeTarget"
                  type="number"
                  step="0.01"
                  value={config.oeeTarget}
                  onChange={(e) =>
                    updateConfig("oeeTarget", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Overall equipment effectiveness target (0-1)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Analyzer Variables */}
        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Analyzer Configuration</CardTitle>
              <CardDescription>
                6 variables controlling efficiency analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="laborEfficiencyTarget">Labor Efficiency Target</Label>
                <Input
                  id="laborEfficiencyTarget"
                  type="number"
                  step="0.01"
                  value={config.laborEfficiencyTarget}
                  onChange={(e) =>
                    updateConfig("laborEfficiencyTarget", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Target labor efficiency (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialUtilizationTarget">
                  Material Utilization Target
                </Label>
                <Input
                  id="materialUtilizationTarget"
                  type="number"
                  step="0.01"
                  value={config.materialUtilizationTarget}
                  onChange={(e) =>
                    updateConfig("materialUtilizationTarget", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Target material utilization (0-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wasteReductionTarget">Waste Reduction Target</Label>
                <Input
                  id="wasteReductionTarget"
                  type="number"
                  step="0.01"
                  value={config.wasteReductionTarget}
                  onChange={(e) =>
                    updateConfig("wasteReductionTarget", parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Target waste reduction (0-1)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => applyPreset(selectedPreset)}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Reset to Preset
        </Button>
        <Button onClick={handleSave}>
          <IconDeviceFloppy className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
