import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CourseDetails = () => {
  const { subjectOfferingId } = useParams();
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [notesRes, assignmentsRes] = await Promise.all([
          axios.get(`http://localhost:3002/api/notes/${subjectOfferingId}`),
          axios.get(`http://localhost:3002/api/assignments/${subjectOfferingId}`)
        ]);
        setNotes(notesRes.data);
        setAssignments(assignmentsRes.data);
      } catch (err) {
        console.error("Error fetching course details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [subjectOfferingId]);

  if (loading) return <div>Loading course materials...</div>;

  return (
    <div className="course-details-page">
      <h2>Course Resources</h2>
      
      <section>
        <h3>Faculty Notes</h3>
        {notes.length > 0 ? notes.map(note => (
          <div key={note._id} className="resource-card">
            <h4>{note.title}</h4>
            <a href={note.file_url} target="_blank">Download PDF</a>
          </div>
        )) : <p>No notes uploaded yet.</p>}
      </section>

      <section>
        <h3>Assignments</h3>
        {assignments.length > 0 ? assignments.map(asm => (
          <div key={asm._id} className="resource-card">
            <h4>{asm.title}</h4>
            <p>Due: {new Date(asm.due_date).toLocaleDateString()}</p>
            <a href={asm.file_url} target="_blank">View Instructions</a>
          </div>
        )) : <p>No assignments posted.</p>}
      </section>
    </div>
  );
};