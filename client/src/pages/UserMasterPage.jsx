export default function UserMasterPage() {
  return (
    <div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">

        <div>

          <h1 className="text-3xl font-bold">
            User Master
          </h1>

          <p className="text-gray-500">
            Manage users, roles and plant assignments
          </p>

        </div>

        <div className="flex gap-3 mt-4 md:mt-0">

          <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
            Export
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Add User
          </button>

        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

      <div className="bg-white p-5 rounded-xl shadow">

        <h3 className="text-gray-500">
          Total Users
        </h3>

        <p className="text-3xl font-bold text-blue-600">
          12
        </p>

      </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3 className="text-gray-500">
          Managers
        </h3>

        <p className="text-3xl font-bold text-green-600">
          3
        </p>

      </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3 className="text-gray-500">
          Supervisors
        </h3>

        <p className="text-3xl font-bold text-purple-600">
          8
        </p>

      </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3 className="text-gray-500">
          Active Users
        </h3>

        <p className="text-3xl font-bold text-orange-600">
          12
        </p>

      </div>

    </div>
        <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="text-xl font-semibold mb-4">
        Add New User
      </h2>

      <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <input
          type="text"
          placeholder="Full Name"
          className="border p-3 rounded-lg"
        />

        <input
          type="email"
          placeholder="Email Address"
          className="border p-3 rounded-lg"
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-3 rounded-lg"
        />

        <input
          type="text"
          placeholder="Employee ID"
          className="border p-3 rounded-lg"
        />

        <select className="border p-3 rounded-lg">

          <option>Select Role</option>

          <option>Super Admin</option>

          <option>Manager</option>

          <option>Supervisor</option>

        </select>

        <select className="border p-3 rounded-lg">

          <option>Select Plant</option>

          <option>Plant A</option>

          <option>Plant B</option>

          <option>Plant C</option>

        </select>

        <input
          type="text"
          placeholder="Location"
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
          Save User
        </button>

      </form>

    </div>
        <div className="bg-white p-6 rounded-xl shadow mt-8">

      <h2 className="text-xl font-semibold mb-4">
        User List
      </h2>

          <div className="flex flex-col lg:flex-row gap-4 mb-4">

      <input
        type="text"
        placeholder="Search User..."
        className="border p-3 rounded-lg flex-1"
      />

      <select className="border p-3 rounded-lg">

        <option>All Roles</option>

        <option>Super Admin</option>

        <option>Manager</option>

        <option>Supervisor</option>

      </select>

      <select className="border p-3 rounded-lg">

        <option>All Plants</option>

        <option>Plant A</option>

        <option>Plant B</option>

        <option>Plant C</option>

      </select>

    </div>

      <div className="overflow-x-auto">

        <table className="w-full border-collapse">

          <thead>

            <tr className="bg-slate-100">

              <th className="border p-3 text-left">
                Employee ID
              </th>

              <th className="border p-3 text-left">
                Name
              </th>

              <th className="border p-3 text-left">
                Role
              </th>

              <th className="border p-3 text-left">
                Plant
              </th>

              <th className="border p-3 text-left">
                Location
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
                EMP001
              </td>

              <td className="border p-3">
                Amit Kumar
              </td>

              <td className="border p-3">
                Manager
              </td>

              <td className="border p-3">
                Plant A
              </td>

              <td className="border p-3">
                Jaipur
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
                EMP002
              </td>

              <td className="border p-3">
                Rahul Sharma
              </td>

              <td className="border p-3">
                Supervisor
              </td>

              <td className="border p-3">
                Plant A
              </td>

              <td className="border p-3">
                Jaipur
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