interface ServiceCardProps {
  id: string;
  name: string;
  iconPath: string;
}

export const ServiceCard = ({ id, name, iconPath }: ServiceCardProps) => {
  return (
    <button 
      className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="text-gray-500 flex gap-1">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d={iconPath} strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-800 text-center">{name}</span>
    </button>
  );
};
