import { useState } from 'react';

const Users = () => {
    // Data dummy staf
    const [staff] = useState([
        { id: 1, name: 'Budi Santoso', username: 'admin_budi', role: 'Admin', status: 'Aktif' },
        { id: 2, name: 'Anto Wijaya', username: 'teknisi_anto', role: 'Teknisi', status: 'Aktif' },
    ]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Staf</h1>
                    <p className="text-gray-500 mt-1">Kelola hak akses Admin dan Teknisi</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition font-bold">
                    + Tambah Staf Baru
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Staf</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role (Peran)</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staff.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                                    <button className="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;