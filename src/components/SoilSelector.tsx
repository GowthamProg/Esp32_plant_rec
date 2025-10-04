import { useEffect } from 'react';

const soilTypes = [
  { value: 'Black', label: 'Black', icon: '🏖️' },
  { value: 'Alluvial', label: 'Alluvial', icon: '🌱' },
  { value: 'Red', label: 'Red', icon: '🧱' },
  { value: 'Laterite', label: 'Laterite', icon: '💧' },
  { value: 'Forest', label: 'Forest', icon: '🍂' },
  { value: 'Peaty', label: 'Peaty', icon: '⚪' },
  { value: 'Saline', label: 'Saline', icon: '⚪' },
];

interface SoilSelectorProps {
  selectedSoil: string;
  onSoilChange: (soil: string) => void;
}

const SoilSelector = ({ selectedSoil, onSoilChange }: SoilSelectorProps) => {
  const handleSoilChange = (value: string) => {
    onSoilChange(value); // notify parent
    localStorage.setItem('selectedSoilType', value); // optional
  };

  const selectedSoilData = soilTypes.find(soil => soil.value === selectedSoil);

  return (
    <div className="sensor-card p-6 rounded-lg">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        🌍 Soil Type
      </h3>

      <div className="space-y-4">
        <select
          value={selectedSoil}
          onChange={(e) => handleSoilChange(e.target.value)}
          className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {soilTypes.map((soil) => (
            <option key={soil.value} value={soil.value}>
              {soil.icon} {soil.label}
            </option>
          ))}
        </select>

        {selectedSoilData && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-2xl">{selectedSoilData.icon}</span>
            <div>
              <div className="font-medium">Selected: {selectedSoilData.label}</div>
              <div className="text-sm text-muted-foreground">
                Stored in local storage
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoilSelector;
