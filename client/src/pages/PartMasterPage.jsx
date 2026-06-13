import { useState } from "react";

export default function PartMasterPage() {

    const handleDelete = (id) => { 
      const updatedParts = partData.filter(
            (part) => part.id !== id
          );

          setPartData(updatedParts);
      };


    const handleEdit = (part) => {
        console.log("Editing part:", part);
        setEditId(part.id);

        setModel(part.model);
        setPartName(part.partName);
        setArea(part.area);
        setPartsPerHanger(part.partsPerHanger);
        setStatus(part.status);

      };


    const handleSavePart = () => {

        if (!model || !partName) {
          alert("Please fill required fields");
          return;
        }

    const newPart = {
          id: Date.now(),
          model,
          partName,
          area,
          partsPerHanger,
          status,
        };

        setPartData([...partData, newPart]);

        setModel("");
        setPartName("");
        setArea("");
        setPartsPerHanger("");
        setStatus("Active");
      };
     
    const [model, setModel] = useState("");
    const [partName, setPartName] = useState("");
    const [area, setArea] = useState("");
    const [partsPerHanger, setPartsPerHanger] = useState("");
    const [status, setStatus] = useState("Active");
    const [editId, setEditId] = useState(null);


    const [partData, setPartData] = useState([
      {
        id: 1,
        model: '20"',
        partName: "Front Panel",
        area: 450,
        partsPerHanger: 12,
        status: "Active",
      },

      {
        id: 2,
        model: '20"',
        partName: "Top Cover",
        area: 320,
        partsPerHanger: 10,
        status: "Active",
      },

      {
        id: 3,
        model: '22"',
        partName: "Side RH",
        area: 280,
        partsPerHanger: 8,
        status: "Active",
      },

      {
        id: 4,
        model: '26"',
        partName: "Base",
        area: 510,
        partsPerHanger: 6,
        status: "Active",
      },
    ]);


  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">

        <div>

          <h1 className="text-3xl font-bold">
            Part Master
          </h1>

          <p className="text-gray-500">
            Manage model-part configuration
          </p>

        </div>

        <div className="flex gap-3 mt-4 md:mt-0">

          <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
            Export
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Add Part
          </button>

        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

  <div className="bg-white p-5 rounded-xl shadow">

    <h3 className="text-gray-500">
      Total Parts
    </h3>

    <p className="text-3xl font-bold text-blue-600">
      9
    </p>

  </div>

  <div className="bg-white p-5 rounded-xl shadow">

    <h3 className="text-gray-500">
      Active Parts
    </h3>

    <p className="text-3xl font-bold text-green-600">
      9
    </p>

  </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3 className="text-gray-500">
          Models Linked
        </h3>

        <p className="text-3xl font-bold text-purple-600">
          5
        </p>

      </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3 className="text-gray-500">
          Avg Parts/Hanger
        </h3>

        <p className="text-3xl font-bold text-orange-600">
          12
        </p>

      </div>

    </div>

    <div className="bg-white p-6 rounded-xl shadow">

  <h2 className="text-xl font-semibold mb-4">
    Add New Part
  </h2>

  <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
    >
      <option>Select Part</option>

      <option>Select Model</option>

      <option>18"</option>

      <option>20"</option>

      <option>20" Polar</option>

      <option>22"</option>

      <option>26"</option>

    </select>

    <select
      value={partName}
      onChange={(e) => setPartName(e.target.value)}
      className="border p-3 rounded-lg"
    >

      <option>Select Part</option>

      <option>Front</option>

      <option>Top Cover</option>

      <option>Side RH</option>

      <option>Side RH Small</option>

      <option>LH</option>

      <option>Base</option>

      <option>Base + Leg</option>

      <option>Base 53/76/43.7 With Leg</option>

      <option>Valve Plate</option>

    </select>

    <input
      type="number"
      value={area}
      onChange={(e) => setArea(e.target.value)}
      placeholder="Area (Sq Inch)"
      className="border p-3 rounded-lg"
    />

    <input
      type="number"
      value={partsPerHanger}
      onChange={(e) => setPartsPerHanger(e.target.value)}
      placeholder="Parts Per Hanger"
      className="border p-3 rounded-lg"
    />

    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="border p-3 rounded-lg"
    >

      <option>Active</option>

      <option>Inactive</option>

    </select>

    <button
      type="button"
      onClick={handleSavePart}
      className="bg-blue-600 text-white rounded-lg px-4 py-3"
    >
      Save Part
    </button>

  </form>

</div>

<div className="bg-white p-6 rounded-xl shadow mt-8">

  <h2 className="text-xl font-semibold mb-4">
    Part List
  </h2>

  <div className="flex flex-col lg:flex-row gap-4 mb-4">

  <input
    type="text"
    placeholder="Search Part..."
    className="border p-3 rounded-lg flex-1"
  />

  <select
    value={model}
    onChange={(e) => setModel(e.target.value)}
    className="border p-3 rounded-lg"
  >

    <option>All Models</option>

    <option>18"</option>

    <option>20"</option>

    <option>20" Polar</option>

    <option>22"</option>

    <option>26"</option>

  </select>

  <select
    value={model}
    onChange={(e) => setModel(e.target.value)}
    className="border p-3 rounded-lg"
  >

    <option>All Status</option>

    <option>Active</option>

    <option>Inactive</option>

  </select>

</div>

  <div className="overflow-x-auto">

    <table className="w-full border-collapse">

      <thead>

        <tr className="bg-slate-100">

          <th className="border p-3 text-left">
            Model
          </th>

          <th className="border p-3 text-left">
            Part Name
          </th>

          <th className="border p-3 text-left">
            Area (Sq Inch)
          </th>

          <th className="border p-3 text-left">
            Parts / Hanger
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

        {partData.map((part) => (

          <tr key={part.id}>

            <td className="border p-3">
              {part.model}
            </td>

            <td className="border p-3">
              {part.partName}
            </td>

            <td className="border p-3">
              {part.area}
            </td>

            <td className="border p-3">
              {part.partsPerHanger}
            </td>

            <td className="border p-3 text-green-600 font-semibold">
              {part.status}
            </td>

            <td className="border p-3">

              <button
                onClick={() => handleEdit(part)}
                className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(part.id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>

    </div>
  );
}