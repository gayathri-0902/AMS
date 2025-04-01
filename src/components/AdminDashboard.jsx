import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";



function AdminDashboard() {
  const { logout } = useAuth();
  const [file, setFile] = useState();
  const [studentFile, setStudentFile] = useState();
  const [facultyFile, setFacultyFile] = useState();
  const [classFile, setClassFile] = useState();
  const [timetableFile, setTimetableFile] = useState();
  const uploadFile = (file, endpoint) => {
    if (!file) {
      alert("Please select a file before uploading.");
      return;
    }
    const formData = new FormData()
    formData.append('file', file);
    axios
      .post(`http://localhost:3001/api/${endpoint}`, formData)
      .then((res) => alert("Upload successful!"))
      .catch((err) => console.error("Upload error:", err));
  };
  


  // //////////////

  // const [message, setMessage] = useState('');
  // const [loading, setLoading] = useState(false);

  // // API endpoint for promoting students (assume it's '/promote-students' on the backend)
  // const handlePromoteClick = async () => {
  //   setLoading(true);
  //   setMessage(''); // Reset message on each click

  //   try {
  //     // Sending the request to the backend API
  //     const response = await axios.post('http://localhost:3001/api/yearly-update');
      
  //     // Success message
  //     setMessage(response.data);
  //   } catch (error) {
  //     // Error handling
  //     setMessage('Error promoting students. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }



  return (
    <div className="admin-dashboard p-4">
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
      <button
        onClick={logout}
        className="absolute top-4 right-4 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        <HiOutlineLogout className="w-6 h-6" />
      </button>


      {/* <div className="mb-6">
      <h3 className="text-xl font-medium mb-2">Promote Students</h3>
      <button 
        onClick={handlePromoteClick} 
        disabled={loading}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        {loading ? 'Processing...' : 'Promote Students'}
      </button>

      {message && <p>{message}</p>}
    </div> */}


    {/* workingone */}
    {/* <div className="mb-6">
      <h3 className="text-xl font-medium mb-2">Add Students</h3>
      
          <h2 className="text-xl font-bold">Upload Student JSON</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload} className="bg-blue-500 text-white">Upload</button>
          {message1 && <p className="text-sm text-gray-700 mt-2">{message1}</p>}
        
  
    </div> */}

<div>
        <h3>Upload Students</h3>
        <input type="file" onChange={(e) => setStudentFile(e.target.files[0])} />
        <button onClick={() => uploadFile(studentFile, "upload-students")}>Upload</button>
      </div>

      <div>
        <h3>Upload Faculty</h3>
        <input type="file" onChange={(e) => setFacultyFile(e.target.files[0])} />
        <button onClick={() => uploadFile(facultyFile, "upload-faculty")}>Upload</button>
      </div>

      <div>
        <h3>Upload Classes</h3>
        <input type="file" onChange={(e) => setClassFile(e.target.files[0])} />
        <button onClick={() => uploadFile(classFile, "upload-classes")}>Upload</button>
      </div>

      <div>
        <h3>Upload Timetable</h3>
        <input type="file" onChange={(e) => setTimetableFile(e.target.files[0])} />
        <button onClick={() => uploadFile(timetableFile, "upload-timetable")}>Upload</button>
      </div>
    </div>

  );

  }


export default AdminDashboard;
