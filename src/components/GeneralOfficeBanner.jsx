import { AlertCircle } from 'lucide-react';

export default function GeneralOfficeBanner({ message }) {
  if (!message) return null;

  return (
    <div className="bg-sage-600 text-white px-4 py-2 flex items-center justify-center space-x-2 text-sm font-medium shadow-sm z-50 relative">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}
