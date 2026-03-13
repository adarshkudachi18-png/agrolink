import { Calendar } from 'lucide-react';

interface DeliveryItem {
  date: string;
  crop: string;
  farmer: string;
  quantity: string;
}

interface DeliveryCalendarProps {
  deliveries: DeliveryItem[];
}

export function DeliveryCalendar({ deliveries }: DeliveryCalendarProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-green-600" />
        <h3 className="text-lg text-gray-800">Delivery Schedule</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm text-gray-600">Date</th>
              <th className="text-left py-3 px-2 text-sm text-gray-600">Crop</th>
              <th className="text-left py-3 px-2 text-sm text-gray-600">Farmer</th>
              <th className="text-left py-3 px-2 text-sm text-gray-600">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-2 text-sm text-gray-900">{delivery.date}</td>
                <td className="py-3 px-2 text-sm text-gray-900">{delivery.crop}</td>
                <td className="py-3 px-2 text-sm text-gray-600">{delivery.farmer}</td>
                <td className="py-3 px-2 text-sm text-gray-900">{delivery.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
