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
    <div className="overflow-hidden rounded-2xl border border-[#D2D4D7] shadow-[0_4px_16px_rgba(32,33,36,0.08)]">
      <table className="w-full">
        <thead>
          <tr>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Name</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Email</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Last Visit</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Total Spent</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-[#9AA0A6] bg-[#E8EAED]">
                No recent customer data available
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => (
              <tr key={customer.id} className="transition-colors hover:bg-[#F1F3F4]">
                <td className="px-5 py-4 text-[#3C4043] font-medium bg-[#E8EAED] border-b border-[#D2D4D7]">{customer.name}</td>
                <td className="px-5 py-4 text-[#3C4043] bg-[#E8EAED] border-b border-[#D2D4D7]">{customer.email}</td>
                <td className="px-5 py-4 text-[#3C4043] bg-[#E8EAED] border-b border-[#D2D4D7]">
                  {format(new Date(customer.lastVisit), 'MMM dd, yyyy')}
                </td>
                <td className="px-5 py-4 text-[#3C4043] font-semibold bg-[#E8EAED] border-b border-[#D2D4D7]">
                  ${customer.totalSpent.toLocaleString()}
                </td>
                <td className="px-5 py-4 bg-[#E8EAED] border-b border-[#D2D4D7]">
                  <button className="bg-[#E8EAED] text-[#3C4043] border border-[#D2D4D7] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 hover:border-[#9AA0A6] hover:bg-[#F1F3F4] hover:transform hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(32,33,36,0.1)]">
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