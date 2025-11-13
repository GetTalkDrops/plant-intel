"use client";

/**
 * Config Variables Editor Component
 * Editor for configuration variables grouped by category
 */

import {
  CORE_CONFIG_VARIABLES,
  getConfigVariablesByGroup,
} from "@/lib/config-variables";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ConfigVariablesEditorProps {
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export function ConfigVariablesEditor({
  values,
  onChange,
}: ConfigVariablesEditorProps) {
  const grouped = getConfigVariablesByGroup();

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, variables]) => (
        <Card key={group} className="p-4">
          <h3 className="text-lg font-semibold mb-4">{group}</h3>
          <div className="space-y-4">
            {variables.map((variable) => (
              <div key={variable.key} className="space-y-2">
                <Label htmlFor={variable.key}>
                  {variable.label}
                  <span className="text-sm text-gray-500 ml-2">
                    {variable.description}
                  </span>
                </Label>

                {variable.type === "number" && (
                  <Input
                    id={variable.key}
                    type="number"
                    value={values[variable.key] ?? variable.defaultValue}
                    onChange={(e) =>
                      handleChange(variable.key, Number(e.target.value))
                    }
                    min={variable.validation?.min}
                    max={variable.validation?.max}
                  />
                )}

                {variable.type === "text" && (
                  <Input
                    id={variable.key}
                    type="text"
                    value={values[variable.key] ?? variable.defaultValue}
                    onChange={(e) => handleChange(variable.key, e.target.value)}
                  />
                )}

                {variable.type === "boolean" && (
                  <div className="flex items-center space-x-2">
                    <input
                      id={variable.key}
                      type="checkbox"
                      checked={values[variable.key] ?? variable.defaultValue}
                      onChange={(e) =>
                        handleChange(variable.key, e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor={variable.key} className="font-normal">
                      Enable
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
