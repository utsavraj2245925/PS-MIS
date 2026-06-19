import { useState, useEffect } from "react";
import axios from "axios";

export default function PartMasterPage() {

  const [model, setModel] = useState("");
  const [partName, setPartName] = useState("");
  const [area, setArea] = useState("");
  const [partsPerHanger, setPartsPerHanger] = useState("");
  const [status, setStatus] = useState("Active");

  const backendUrl = import.meta.env.VITE_API_URI;

  const [filterModel, setFilterModel] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [partData, setPartData] = useState([]);


  const fetchParts = async () => {
    try {

      const response = await axios.get(
        `${backendUrl}/parts`
      );

      setPartData(response.data);

    } catch (error) {

      console.error("Error fetching parts:", error);
      alert("Error fetching parts");

    }
  };


  useEffect(() => {

    fetchParts();

  }, []);



  const resetForm = () => {

    setModel("");
    setPartName("");
    setArea("");
    setPartsPerHanger("");
    setStatus("Active");
    setEditId(null);

  };



  const handleDelete = async (id) => {

    if (window.confirm("Delete this part?")) {

      try {

        await axios.delete(
          `${backendUrl}/parts/${id}`
        );

        fetchParts();

      } catch (error) {

        console.error("Error deleting part:", error);
        alert("Error deleting part");

      }

    }

  };



  const handleEdit = (part) => {

    setEditId(part._id);

    setModel(part.model);
    setPartName(part.partName);
    setArea(part.area);
    setPartsPerHanger(part.partsPerHanger);
    setStatus(part.status);

    setShowModal(true);

  };



  const handleSavePart = async () => {

    if (!model || !partName) {

      alert("Please fill required fields");
      return;

    }


    const newPart = {

      model,
      partName,
      area,
      partsPerHanger,
      status,

    };


    try {

      const response = await axios.post(
        `${backendUrl}/parts`,
        newPart
      );


      resetForm();

      console.log(
        "Part created successfully:",
        response.data
      );


      fetchParts();


    } catch (error) {

      console.error(
        "Error creating part:",
        error
      );

      alert("Error creating part");

    }

  };




  const handleUpdatePart = async () => {

    const response = await axios.put(
      `${backendUrl}/parts/${editId}`,
      {

        model,
        partName,
        area,
        partsPerHanger,
        status,

      }
    );


    setPartData(
      prev =>
        prev.map(
          p =>
            p._id === editId
              ? response.data
              : p
        )
    );


    setShowModal(false);

    resetForm();

  };



  function Debaunce(func, delay) {

    let timeoutId;

    return function (...args) {

      if (timeoutId)
        clearTimeout(timeoutId);


      timeoutId = setTimeout(() => {

        func(...args);

      }, delay);

    };

  }





  useEffect(() => {

    Debaunce(handleFilterParts,500)();

  }, []);



  const handleFilterParts = async () => {

    try {

      setIsLoading(true);


      const response = await axios.get(
        `${backendUrl}/parts/filter`,
        {

          params: {

            model:
              filterModel !== "All"
                ? filterModel
                : undefined,


            status:
              filterStatus !== "All"
                ? filterStatus
                : undefined,


            partName:
              searchTerm || undefined,

          }

        }
      );


      setPartData(response.data);



    } catch (error) {


      console.error(
        "Error filtering parts:",
        error
      );


      alert(
        "Error filtering parts"
      );


    } finally {

      setIsLoading(false);

    }

  };



  useEffect(() => {

    Debaunce(
      handleFilterParts,
      500
    )();


  }, [
    searchTerm,
    filterModel,
    filterStatus
  ]);



  return (

    <div className="min-h-screen bg-slate-50 p-4">

      <div className="max-w-7xl mx-auto space-y-5">


        {/* Header */}

        <div>

          <h1 className="text-3xl font-bold text-slate-800">
            Part Master
          </h1>


          <p className="text-sm text-slate-500 mt-1">
            Manage Model-Part Configuration
          </p>

        </div>




        {/* Dashboard Cards */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">


          <div className="bg-white border rounded-xl p-4 shadow-sm">

            <p className="text-xs text-slate-500">
              Total Parts
            </p>

            <h2 className="text-2xl font-bold text-blue-600 mt-1">
              {partData.length}
            </h2>

          </div>



          <div className="bg-white border rounded-xl p-4 shadow-sm">

            <p className="text-xs text-slate-500">
              Active Parts
            </p>

            <h2 className="text-2xl font-bold text-green-600 mt-1">
              {
                partData.filter(
                  p => p.status==="Active"
                ).length
              }
            </h2>

          </div>



          <div className="bg-white border rounded-xl p-4 shadow-sm">

            <p className="text-xs text-slate-500">
              Inactive Parts
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-1">
              {
                partData.filter(
                  p => p.status==="Inactive"
                ).length
              }
            </h2>

          </div>



          <div className="bg-white border rounded-xl p-4 shadow-sm">

            <p className="text-xs text-slate-500">
              Models Linked
            </p>

            <h2 className="text-2xl font-bold text-purple-600 mt-1">

              {
                [
                  ...new Set(
                    partData.map(
                      p=>p.model
                    )
                  )
                ].length
              }

            </h2>

          </div>


        </div>





        {/* Add Part Section */}

        <div className="bg-white border rounded-xl shadow-sm p-5">


          <div className="mb-4">

            <h2 className="text-lg font-bold text-slate-800">
              Add New Part
            </h2>


            <p className="text-xs text-slate-500">
              Create model-part mapping
            </p>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">


            <select
              value={model}
              onChange={(e)=>setModel(e.target.value)}
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="">
                Select Model
              </option>

              <option value='18"'>
                18"
              </option>

              <option value='20"'>
                20"
              </option>

              <option value='20" Polar'>
                20" Polar
              </option>

              <option value='22"'>
                22"
              </option>

              <option value='26"'>
                26"
              </option>

            </select>


            <select
              value={partName}
              onChange={(e)=>setPartName(e.target.value)}
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="">
                Select Part
              </option>

              <option>
                Front
              </option>

              <option>
                Top Cover
              </option>

              <option>
                Side RH
              </option>

              <option>
                LH
              </option>

              <option>
                Base
              </option>

              <option>
                Base + Leg
              </option>

              <option>
                Valve Plate
              </option>


            </select>

                        <input
              type="number"
              value={area}
              onChange={(e)=>setArea(e.target.value)}
              placeholder="Area (Sq Inch)"
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />


            <input
              type="number"
              value={partsPerHanger}
              onChange={(e)=>setPartsPerHanger(e.target.value)}
              placeholder="Parts Per Hanger"
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />



            <select
              value={status}
              onChange={(e)=>setStatus(e.target.value)}
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

            </select>



            <button
              type="button"
              onClick={handleSavePart}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Save Part
            </button>


          </div>

        </div>





        {/* Part List */}

        <div className="bg-white border rounded-xl shadow-sm p-5">


          <div className="flex justify-between items-center mb-4">


            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Part List
                {
                  isLoading &&
                  <span className="ml-2 text-xs text-blue-500">
                    Loading...
                  </span>
                }
              </h2>


              <p className="text-xs text-slate-500">
                Search, filter and manage parts
              </p>

            </div>


          </div>




          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">


            <input
              type="text"
              placeholder="Search Part or Model..."
              value={searchTerm}
              onChange={(e)=>setSearchTerm(e.target.value)}
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />



            <select
              value={filterModel}
              onChange={(e)=>setFilterModel(e.target.value)}
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="All">
                All Models
              </option>

              <option value='18"'>
                18"
              </option>

              <option value='20"'>
                20"
              </option>

              <option value='20" Polar'>
                20" Polar
              </option>

              <option value='22"'>
                22"
              </option>

              <option value='26"'>
                26"
              </option>


            </select>



            <select
              value={filterStatus}
              onChange={(e)=>setFilterStatus(e.target.value)}
              className="h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>


            </select>


          </div>





          <div className="overflow-x-auto border rounded-lg">


            <table className="w-full text-sm">


              <thead>

                <tr className="bg-slate-100">


                  <th className="px-4 py-3 text-left">
                    Model
                  </th>


                  <th className="px-4 py-3 text-left">
                    Part Name
                  </th>


                  <th className="px-4 py-3 text-left">
                    Area
                  </th>


                  <th className="px-4 py-3 text-left">
                    Parts/Hanger
                  </th>


                  <th className="px-4 py-3 text-left">
                    Status
                  </th>


                  <th className="px-4 py-3 text-center">
                    Action
                  </th>


                </tr>

              </thead>



              <tbody>


              {
                partData.length > 0 ? (

                  partData.map((part)=>(

                    <tr
                      key={part._id}
                      className="border-t hover:bg-slate-50"
                    >


                      <td className="px-4 py-3">
                        {part.model}
                      </td>



                      <td className="px-4 py-3 font-medium">
                        {part.partName}
                      </td>



                      <td className="px-4 py-3">
                        {part.area}
                      </td>



                      <td className="px-4 py-3">
                        {part.partsPerHanger}
                      </td>



                      <td className="px-4 py-3">


                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            part.status==="Active"
                            ?
                            "bg-green-100 text-green-700"
                            :
                            "bg-red-100 text-red-700"
                          }`}
                        >

                          {part.status}

                        </span>


                      </td>



                      <td className="px-4 py-3 text-center">


                        <button
                          onClick={()=>handleEdit(part)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-xs mr-2"
                        >
                          Edit
                        </button>



                        <button
                          onClick={()=>handleDelete(part._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs"
                        >
                          Delete
                        </button>


                      </td>



                    </tr>


                  ))


                ) : (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center py-8 text-slate-500"
                    >

                      No Parts Found

                    </td>

                  </tr>

                )


              }


              </tbody>


            </table>


          </div>


        </div>





        {/* Edit Modal */}


        {
          showModal && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">


            <div className="bg-white w-full max-w-md rounded-xl p-5 shadow-xl">


              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Edit Part
              </h2>



              <div className="space-y-3">


                <select
                  value={model}
                  onChange={(e)=>setModel(e.target.value)}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                >

                  <option value='18"'>18"</option>
                  <option value='20"'>20"</option>
                  <option value='20" Polar'>20" Polar</option>
                  <option value='22"'>22"</option>
                  <option value='26"'>26"</option>

                </select>



                <select
                  value={partName}
                  onChange={(e)=>setPartName(e.target.value)}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                >

                  <option>
                    Front
                  </option>

                  <option>
                    Top Cover
                  </option>

                  <option>
                    Side RH
                  </option>

                  <option>
                    Side RH Small
                  </option>

                  <option>
                    LH
                  </option>

                  <option>
                    Base
                  </option>

                  <option>
                    Base + Leg
                  </option>

                  <option>
                    Base 53/76/43.7 With Leg
                  </option>

                  <option>
                    Valve Plate
                  </option>

                </select>

                                <input
                  type="number"
                  value={area}
                  onChange={(e)=>setArea(e.target.value)}
                  placeholder="Area"
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />


                <input
                  type="number"
                  value={partsPerHanger}
                  onChange={(e)=>setPartsPerHanger(e.target.value)}
                  placeholder="Parts Per Hanger"
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />



                <select
                  value={status}
                  onChange={(e)=>setStatus(e.target.value)}
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="Active">
                    Active
                  </option>


                  <option value="Inactive">
                    Inactive
                  </option>


                </select>


              </div>




              <div className="flex justify-end gap-2 mt-5">


                <button
                  onClick={()=>setShowModal(false)}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>



                <button
                  onClick={handleUpdatePart}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Update Part
                </button>


              </div>



            </div>


          </div>


          )
        }


      </div>


    </div>


  );

}