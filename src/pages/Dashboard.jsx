const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

        {/* Kotak-kotak Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kotak 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-semibold">Pelanggan Aktif</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">1,245</p>
          </div>

          {/* Kotak 2 */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-semibold">Pelanggan Isolir</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">32</p>
          </div>

          {/* Kotak 3 */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-semibold">Koneksi Putus / Offline</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">7</p>
          </div>

        </div>

        {/* Ruang untuk Peta atau Tabel nanti */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md h-64 flex items-center justify-center border border-gray-200">
            <p className="text-gray-400">Area ini nanti akan kita isi dengan Peta Jaringan Interaktif</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;