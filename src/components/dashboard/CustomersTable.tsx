import { format } from 'date-fns';

interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  totalSpent: number;
}

interface CustomersTableProps {
  customers: RecentCustomer[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full">
        <thead>
          <tr>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Name</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Email</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Last Visit</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Total Spent</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1a1a]">
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500 bg-[#0a0a0a]">
                No recent customer data available
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => (
              <tr key={customer.id} className="transition-colors hover:bg-[#1a1a1a]/50">
                <td className="px-5 py-4 text-white font-medium">{customer.name}</td>
                <td className="px-5 py-4 text-gray-300">{customer.email}</td>
                <td className="px-5 py-4 text-gray-300">
                  {format(new Date(customer.lastVisit), 'MMM dd, yyyy')}
                </td>
                <td className="px-5 py-4 text-[#C9A449] font-semibold">
                  ${customer.totalSpent.toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <button className="bg-transparent text-[#C9A449] border border-[#C9A449]/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:bg-[#C9A449]/10 hover:border-[#C9A449]/50">
                    View Profile
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 