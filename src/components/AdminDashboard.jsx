import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";



function AdminDashboard() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [message1, setMessage1] = useState("");

  function handleFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  async function handleFileUpload() {
    if (!file) return;

    setStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("API URL:", `${import.meta.env.VITE_API_BASE_URL}/api/upload-students`);

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload-students`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      setStatus('success');
      setUploadProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      setUploadProgress(0);
    }
  }

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







  const [faculty, setFaculty] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
  });
  
  
  const { logout } = useAuth();

  const handleFacultyChange = (e) => {
    const { name, value } = e.target;
    setFaculty((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  

  

  const handleFacultySubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3001/api/faculty",
        faculty
      );
      if (response.status === 200) {
        alert("Faculty added successfully");
        setFaculty({
          name: "",
          email: "",
          department: "",
          password: "",
        });
      } else {
        alert("Error adding faculty");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("There was an error while adding the faculty.");
    }
  };

  

  



  return (
    <div className="admin-dashboard p-4">
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
      <button
        onClick={logout}
        className="absolute top-4 right-4 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        <HiOutlineLogout className="w-6 h-6" />
      </button>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Add Faculty</h3>
        <form onSubmit={handleFacultySubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Faculty Name"
            onChange={handleFacultyChange}
            value={faculty.name}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Faculty Email"
            onChange={handleFacultyChange}
            value={faculty.email}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            onChange={handleFacultyChange}
            value={faculty.department}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleFacultyChange}
            value={faculty.password}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Faculty
          </button>
        </form>
      </div>

      

      


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

<div className="space-y-2">
      <input type="file" onChange={handleFileChange} />

      {file && (
        <div className="mb-4 text-sm">
          <p>File name: {file.name}</p>
          <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
          <p>Type: {file.type}</p>
        </div>
      )}

      {status === 'uploading' && (
        <div className="space-y-2">
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{uploadProgress}% uploaded</p>
        </div>
      )}

      {file && status !== 'uploading' && (
        <button onClick={handleFileUpload}>Upload</button>
      )}

      {status === 'success' && (
        <p className="text-sm text-green-600">File uploaded successfully!</p>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-600">Upload failed. Please try again.</p>
      )}
    </div>

      


    </div>
  );

  }


export default AdminDashboard;
