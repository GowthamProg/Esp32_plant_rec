interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: string;
  status?: 'good' | 'warning' | 'critical';
}

const SensorCard = ({ title, value, unit, icon, status = 'good' }: SensorCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-success';
    }
  };

  return (
    <div className="sensor-card p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className={`status-indicator ${getStatusColor(status)}`}></div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        <span className="text-muted-foreground font-medium">{unit}</span>
      </div>
    </div>
  );
};

export default SensorCard;