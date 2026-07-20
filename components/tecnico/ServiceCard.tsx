interface ServiceCardProps {
  id: string;
  name: string;
  iconPath: string;
  price: number;
  isSelected: boolean;
  onToggle: () => void;
}

export const ServiceCard = ({ id, name, iconPath, price, isSelected, onToggle }: ServiceCardProps) => {
  return (
    <button 
      onClick={onToggle}
      className={`relative bg-white border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer h-full
        ${isSelected 
          ? 'border-primary bg-primary-container/20 shadow-md transform scale-[1.02]' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
    >
      <div className={`flex gap-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
        <span className="material-symbols-outlined text-4xl">
          {iconPath || 'minor_crash'}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-gray-800 text-center leading-tight mb-1">{name}</span>
        <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
          ${price.toLocaleString()}
        </span>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-on-primary rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
        </div>
      )}
    </button>
  );
};
