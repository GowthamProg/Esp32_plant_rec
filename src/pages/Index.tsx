import { useState, useEffect } from 'react';
import SensorCard from '@/components/SensorCard';
import SoilSelector from '@/components/SoilSelector';

interface SensorData {
  N: number;
  P: number;
  K: number;
  pH: number;
  Humidity: number;
  Temperature: number;
}

interface CropRequirement {
  name: string;
  N: string | number;
  P: string | number;
  K: string | number;
}

const getSelectedSoilType = () => {
  const storedSoil = localStorage.getItem('selectedSoilType');
  return storedSoil ? storedSoil : 'Peaty';
};

const Index = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    N: 0,
    P: 0,
    K: 0,
    pH: 0,
    Humidity: 0,
    Temperature: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected-cloud' | 'disconnected'>('disconnected');
  const [soilType, setSoilType] = useState<string>(getSelectedSoilType());
  const [recommendedCrops, setRecommendedCrops] = useState<string[]>([]);
  const [cropRequirements, setCropRequirements] = useState<CropRequirement[]>([]);

  const CHANNEL_ID = '3098218';
  const READ_API_KEY = 'ULKUR5HSBLMPBMDS';
  const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;

  // Fetch sensor data
  const fetchFromThingSpeak = async () => {
    try {
      const response = await fetch(THINGSPEAK_URL);
      if (response.ok) {
        const data = await response.json();

        if (data) {
          const rawN = Number(data.field1) || 0;
          const rawP = Number(data.field2) || 0;
          const rawK = Number(data.field3) || 0;
          const rawPH = Number(data.field4) || 0;
          const rawHumidity = Number(data.field5) || 0;
          const rawTemp = Number(data.field6) || 0;

          const updatedData: SensorData = {
            N: Math.round(rawN * 8.5),
            P: Math.round(rawP * 8.5),
            K: Math.round(rawK * 4.5), // only K uses 4.5 multiplier
            pH: rawPH,
            Humidity: rawHumidity,
            Temperature: rawTemp,
          };

          setSensorData(updatedData);
          setConnectionStatus('connected-cloud');
          setLastUpdated(new Date(data.created_at));
        } else {
          setSensorData({ N: 0, P: 0, K: 0, pH: 0, Humidity: 0, Temperature: 0 });
        }
        return true;
      }
    } catch (error) {
      console.error('ThingSpeak fetch failed:', error);
    }
    return false;
  };

  const fetchSensorData = async () => {
    const success = await fetchFromThingSpeak();
    if (!success) {
      setSensorData({ N: 0, P: 0, K: 0, pH: 0, Humidity: 0, Temperature: 0 });
      setConnectionStatus('disconnected');
      setLastUpdated(new Date());
    }
  };

  // initial + interval polling
  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Recompute recommended crops & crop requirements whenever NPK or soil changes
  useEffect(() => {
    const { N, P, K } = sensorData;

    const crops: string[] = [];
    const requirements: CropRequirement[] = [];

    const addCrop = (name: string, reqN: number, reqP: number, reqK: number) => {
      // Compare sensor data with requirements
      const Nstatus = N >= reqN ? 'Enough' : `${reqN - N} more`;
      const Pstatus = P >= reqP ? 'Enough' : `${reqP - P} more`;
      const Kstatus = K >= reqK ? 'Enough' : `${reqK - K} more`;

      requirements.push({
        name,
        N: Nstatus,
        P: Pstatus,
        K: Kstatus,
      });

      // Recommend only if all are Enough
      if (N >= reqN && P >= reqP && K >= reqK) {
        crops.push(name);
      }
    };

    // Crop requirements depend on soil type
    if (soilType === 'Black') {
      addCrop('Cotton', 70, 20, 20);
      addCrop('Sugarcane', 70, 60, 30);
      addCrop('Sorghum', 50, 15, 15);
    } else if (soilType === 'Alluvial') {
      addCrop('Rice', 60, 40, 30);
      addCrop('Maize', 80, 20, 40);
      addCrop('Pulses', 40, 15, 15);
    } else if (soilType === 'Red') {
      addCrop('Groundnut', 50, 25, 25);
      addCrop('Cotton', 70, 15, 30);
      addCrop('Pulses', 30, 10, 10);
    } else if (soilType === 'Laterite') {
      addCrop('Cashew', 40, 20, 20);
      addCrop('Coffee', 60, 30, 30);
    } else if (soilType === 'Forest') {
      addCrop('Tea', 30, 15, 15);
    } else if (soilType === 'Peaty') {
      addCrop('Rice', 40, 20, 20);
    } else if (soilType === 'Saline') {
      addCrop('Barley', 30, 0, 20);
    }

    setRecommendedCrops(crops);
    setCropRequirements(requirements);
  }, [sensorData, soilType]);

  return (
    <div className="min-h-screen dashboard-gradient">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🌱</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AgriMonitor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Real-time agricultural monitoring system</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`status-indicator ${connectionStatus === 'connected-cloud' ? 'bg-success' : 'bg-destructive'}`}></div>
              <span className="text-sm text-muted-foreground">
                {connectionStatus === 'connected-cloud' ? 'ThingSpeak Cloud' : 'No Data'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sensor Dashboard */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">📊 Sensor Data</h2>
            <div className="text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <SensorCard title="Nitrogen (N)" value={sensorData.N} unit="mg/kg" icon="🔵" />
            <SensorCard title="Phosphorus (P)" value={sensorData.P} unit="mg/kg" icon="🟡" />
            <SensorCard title="Potassium (K)" value={sensorData.K} unit="mg/kg" icon="🔴" />
            <SensorCard title="Soil pH" value={sensorData.pH} unit="" icon="⚗️" />
            <SensorCard title="Humidity" value={sensorData.Humidity} unit="%" icon="💧" />
            {/* <SensorCard title="Temperature" value={sensorData.Temperature} unit="°C" icon="🌡️" /> */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-1">
              <SoilSelector selectedSoil={soilType} onSoilChange={setSoilType} />
            </div>

            {/* Recommended Crops */}
            <div className="lg:col-span-3">
              <div className="sensor-card p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">🌾 Recommended Crops</h3>

                {recommendedCrops.length > 0 ? (
                  <ul className="list-disc list-inside text-foreground">
                    {recommendedCrops.map((crop, idx) => <li key={idx}>{crop}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">⚠️ No suitable crops found for current NPK values. ({soilType} soil)</p>
                )}
              </div>

              {/* Crop Requirement Table */}
              <div className="sensor-card p-6 rounded-lg">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">📋 Crop NPK Requirements</h3>

                {cropRequirements.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 border-b">Crop</th>
                          <th className="px-4 py-2 border-b">N</th>
                          <th className="px-4 py-2 border-b">P</th>
                          <th className="px-4 py-2 border-b">K</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cropRequirements.map((crop, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="px-4 py-2">{crop.name}</td>
                            <td className="px-4 py-2">{crop.N}</td>
                            <td className="px-4 py-2">{crop.P}</td>
                            <td className="px-4 py-2">{crop.K}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No crops defined for selected soil.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card/50 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          🌱 AgriMonitor Dashboard - Real-time agricultural monitoring with ThingSpeak
        </div>
      </footer>
    </div>
  );
};

export default Index;
