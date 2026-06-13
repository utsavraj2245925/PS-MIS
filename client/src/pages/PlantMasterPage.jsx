export default function PlantMasterPage() {
  return (
    <div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">

      <div>

        <h1 className="text-3xl font-bold">
          Plant Master
        </h1>

        <p className="text-gray-500">
          Manage all manufacturing plants
        </p>

      </div>

      <div className="flex gap-3 mt-4 md:mt-0">

        <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Export
        </button>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Add Plant
        </button>

      </div>

    </div>
      <div className="flex flex-col md:flex-row gap-4 mb-4">

      <input
        type="text"
        placeholder="Search Plant..."
        className="border p-3 rounded-lg flex-1"
      />

      <select className="border p-3 rounded-lg w-full md:w-48">

        <option>All Status</option>

        <option>Active</option>

        <option>Inactive</option>

      </select>

    </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="text-gray-500">
          Total Plants
        </h3>

        <p className="text-3xl font-bold text-blue-600">
          3
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="text-gray-500">
          Active Plants
        </h3>

        <p className="text-3xl font-bold text-green-600">
          3
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="text-gray-500">
          Inactive Plants
        </h3>

        <p className="text-3xl font-bold text-red-600">
          0
        </p>
      </div>

    </div>

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4">
          Add New Plant
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Plant Name"
            className="border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Plant Code"
            className="border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Location"
            className="border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Plant Admin"
            className="border p-3 rounded-lg"
          />

          <select className="border p-3 rounded-lg">
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            type="button"
            className="bg-blue-600 text-white rounded-lg px-4 py-3"
          >
            Save Plant
          </button>

        </form>

      </div>
      {/* Plant List */}

    <div className="bg-white p-6 rounded-xl shadow mt-8">

      <h2 className="text-xl font-semibold mb-4">
        Plant List
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full border-collapse">

          <thead>

            <tr className="bg-slate-100">

              <th className="border p-3 text-left">
                Plant Name
              </th>

              <th className="border p-3 text-left">
                Plant Code
              </th>

              <th className="border p-3 text-left">
                Location
              </th>

              <th className="border p-3 text-left">
                Plant Admin
              </th>

              <th className="border p-3 text-left">
                Status
              </th>

              <th className="border p-3 text-left">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td className="border p-3">
                Plant A
              </td>

              <td className="border p-3">
                PLA
              </td>

              <td className="border p-3">
                Noida
              </td>

              <td className="border p-3">
                Amit Kumar
              </td>

              <td className="border p-3 text-green-600 font-semibold">
                Active
              </td>

              <td className="border p-3">

              <button className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
                Edit
              </button>

              <button className="bg-red-600 text-white px-3 py-1 rounded">
                Delete
              </button>

            </td>

            </tr>

            <tr>

              <td className="border p-3">
                Plant B
              </td>

              <td className="border p-3">
                PLB
              </td>

              <td className="border p-3">
                Pune
              </td>

              <td className="border p-3">
                Raj Sharma
              </td>

              <td className="border p-3 text-green-600 font-semibold">
                Active
              </td>

              <td className="border p-3">

            <button className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
              Edit
            </button>

            <button className="bg-red-600 text-white px-3 py-1 rounded">
              Delete
            </button>

          </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>

    </div>
    
    
  );
}