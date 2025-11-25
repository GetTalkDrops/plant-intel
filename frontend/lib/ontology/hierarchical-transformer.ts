// lib/ontology/hierarchical-transformer.ts

export class HierarchicalTransformer {
  private profile: EnhancedMappingProfile;

  async transformAndLoad(
    csvRows: Record<string, any>[],
    batchId: string,
    facilityId: number
  ): Promise<TransformationResult> {
    if (this.profile.data_granularity === "header") {
      // Simple case - one row per work order
      return this.transformHeaderLevel(csvRows, batchId, facilityId);
    }

    if (this.profile.aggregation_strategy === "aggregate") {
      // Aggregate detail to header level
      return this.aggregateToHeader(csvRows, batchId, facilityId);
    }

    // Keep detail - hierarchical load
    return this.transformHierarchical(csvRows, batchId, facilityId);
  }

  /**
   * Simple transformation for header-level data
   */
  private async transformHeaderLevel(
    csvRows: Record<string, any>[],
    batchId: string,
    facilityId: number
  ): Promise<TransformationResult> {
    const workOrders = [];

    for (const row of csvRows) {
      const wo = this.transformHeaderRow(row, batchId, facilityId);
      wo.data_granularity = "header";
      wo.has_detail_rows = false;
      workOrders.push(wo);
    }

    // Insert to work_orders table only
    await supabase.from("work_orders").insert(workOrders);

    return { success: true, workOrdersCreated: workOrders.length };
  }

  /**
   * Aggregate detail rows to header level
   */
  private async aggregateToHeader(
    csvRows: Record<string, any>[],
    batchId: string,
    facilityId: number
  ): Promise<TransformationResult> {
    // Group rows by work order number
    const grouped = this.groupByWorkOrder(csvRows);

    const workOrders = [];

    for (const [woNumber, detailRows] of grouped.entries()) {
      const aggregated = this.aggregateDetails(detailRows);

      workOrders.push({
        facility_id: facilityId,
        uploaded_csv_batch: batchId,
        work_order_number: woNumber,
        data_granularity: "operation", // Original was detail
        has_detail_rows: false, // We aggregated
        total_planned_material_cost: aggregated.total_planned_material_cost,
        total_actual_material_cost: aggregated.total_actual_material_cost,
        total_planned_labor_hours: aggregated.total_planned_labor_hours,
        total_actual_labor_hours: aggregated.total_actual_labor_hours,
        // Store which materials/machines were involved
        source_csv_row: {
          aggregated_from: detailRows.length,
          materials: aggregated.materials,
          machines: aggregated.machines,
        },
      });
    }

    await supabase.from("work_orders").insert(workOrders);

    return {
      success: true,
      workOrdersCreated: workOrders.length,
      detailRowsAggregated: csvRows.length,
    };
  }

  /**
   * Hierarchical transformation - preserve detail
   */
  private async transformHierarchical(
    csvRows: Record<string, any>[],
    batchId: string,
    facilityId: number
  ): Promise<TransformationResult> {
    // Group rows by work order number
    const grouped = this.groupByWorkOrder(csvRows);

    const workOrders = [];
    const workOrderDetails = [];

    for (const [woNumber, detailRows] of grouped.entries()) {
      // Create header row (aggregated totals)
      const headerAggregation = this.aggregateDetails(detailRows);

      const woId = crypto.randomUUID();

      workOrders.push({
        id: woId,
        facility_id: facilityId,
        uploaded_csv_batch: batchId,
        work_order_number: woNumber,
        data_granularity: this.profile.data_granularity,
        has_detail_rows: true,
        total_planned_material_cost:
          headerAggregation.total_planned_material_cost,
        total_actual_material_cost:
          headerAggregation.total_actual_material_cost,
        total_planned_labor_hours: headerAggregation.total_planned_labor_hours,
        total_actual_labor_hours: headerAggregation.total_actual_labor_hours,
        total_units_produced: headerAggregation.total_units_produced,
        total_units_scrapped: headerAggregation.total_units_scrapped,
        production_period_start: this.extractField(
          detailRows[0],
          "production_period_start"
        ),
        production_period_end: this.extractField(
          detailRows[detailRows.length - 1],
          "production_period_end"
        ),
      });

      // Create detail rows
      let operationSeq = 1;
      for (const detailRow of detailRows) {
        workOrderDetails.push({
          work_order_id: woId,
          work_order_number: woNumber,
          operation_sequence: operationSeq++,
          operation_code: this.extractDetailField(detailRow, "operation_code"),
          operation_type: this.extractDetailField(detailRow, "operation_type"),
          machine_id: this.extractDetailField(detailRow, "machine_id"),
          equipment_id: this.extractDetailField(detailRow, "equipment_id"),
          material_code: this.extractDetailField(detailRow, "material_code"),
          supplier_id: this.extractDetailField(detailRow, "supplier_id"),
          planned_material_cost: this.extractDetailField(
            detailRow,
            "planned_material_cost"
          ),
          actual_material_cost: this.extractDetailField(
            detailRow,
            "actual_material_cost"
          ),
          planned_labor_hours: this.extractDetailField(
            detailRow,
            "planned_labor_hours"
          ),
          actual_labor_hours: this.extractDetailField(
            detailRow,
            "actual_labor_hours"
          ),
          units_produced: this.extractDetailField(detailRow, "units_produced"),
          units_scrapped: this.extractDetailField(detailRow, "units_scrapped"),
          quality_issues: this.extractDetailField(detailRow, "quality_issues"),
          downtime_minutes: this.extractDetailField(
            detailRow,
            "downtime_minutes"
          ),
          source_csv_row: detailRow,
        });
      }
    }

    // Insert both headers and details
    await supabase.from("work_orders").insert(workOrders);
    await supabase.from("work_order_details").insert(workOrderDetails);

    return {
      success: true,
      workOrdersCreated: workOrders.length,
      detailRowsCreated: workOrderDetails.length,
    };
  }

  private groupByWorkOrder(
    rows: Record<string, any>[]
  ): Map<string, Record<string, any>[]> {
    const woColumn =
      this.profile.header_mappings.work_order_number.source_columns[0];
    const grouped = new Map<string, Record<string, any>[]>();

    for (const row of rows) {
      const woNumber = row[woColumn];
      if (!grouped.has(woNumber)) {
        grouped.set(woNumber, []);
      }
      grouped.get(woNumber)!.push(row);
    }

    return grouped;
  }

  private aggregateDetails(detailRows: Record<string, any>[]): any {
    const rules = this.profile.aggregation_rules || {
      sum_fields: [
        "planned_material_cost",
        "actual_material_cost",
        "planned_labor_hours",
        "actual_labor_hours",
        "units_produced",
        "units_scrapped",
      ],
      concat_fields: ["material_code", "machine_id"],
      first_fields: ["supplier_id"],
    };

    const result: any = {};

    // Sum numeric fields
    for (const field of rules.sum_fields) {
      result[`total_${field}`] = detailRows.reduce((sum, row) => {
        const value = this.extractDetailField(row, field);
        return sum + (Number(value) || 0);
      }, 0);
    }

    // Concatenate unique values
    for (const field of rules.concat_fields) {
      const values = detailRows
        .map((row) => this.extractDetailField(row, field))
        .filter(Boolean);
      result[field + "s"] = Array.from(new Set(values));
    }

    // Take first value
    for (const field of rules.first_fields) {
      result[field] = this.extractDetailField(detailRows[0], field);
    }

    return result;
  }
}
